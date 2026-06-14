import { supabase } from '@/lib/supabase'

export interface Coordinate {
  lat: number
  lng: number
}

// 1. Geocodificação usando Nominatim (OpenStreetMap)
export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  try {
    // Adicionar um pequeno atraso para respeitar os limites do Nominatim (1 req/sec)
    await new Promise(r => setTimeout(r, 1000));
    
    // Formatar levemente o endereço para o Brasil se não tiver
    const searchAddress = address.toLowerCase().includes('brasil') ? address : `${address}, Brasil`;
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'GerenciamentoDeRotas/1.0'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar:', error);
    return null;
  }
}

// 2. Otimização de Rota usando OSRM (Open Source Routing Machine)
export async function optimizeRoute(garageCoord: Coordinate, clients: { id: string, coord: Coordinate }[]) {
  try {
    // A API do OSRM usa o formato lng,lat
    const coordsStr = [
      `${garageCoord.lng},${garageCoord.lat}`,
      ...clients.map(c => `${c.coord.lng},${c.coord.lat}`)
    ].join(';');

    // roundtrip=true e source=first garante que a rota começa na garagem, passa por todos, e volta pra garagem
    const url = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?roundtrip=true&source=first`;

    const response = await fetch(url);
    if (!response.ok) {
        const errText = await response.text();
        console.error('OSRM Erro HTTP:', response.status, errText);
        throw new Error(`Falha no serviço de roteamento (OSRM). Tente novamente.`);
    }

    const data = await response.json();
    if (data.code !== 'Ok') {
        console.error('OSRM Erro Code:', data);
        throw new Error(`Erro do OSRM: ${data.code}`);
    }

    // data.waypoints contém a ordem original e o 'waypoint_index' indica a ordem otimizada
    // O index 0 é a garagem (source=first). Os clientes são index 1..N.
    
    const waypoints = data.waypoints;
    // O OSRM retorna os waypoints embaralhados conforme a ordem do TSP
    // waypoints[i].waypoint_index é a posição do ponto "i" na viagem.
    // i=0 é a garagem, i=1 é o cliente[0], etc.

    const optimizedSequence: { clientId: string, sequence: number }[] = [];

    // O OSRM retorna a ordem na qual as coordenadas enviadas devem ser visitadas.
    // waypoints é um array no mesmo tamanho da string de coordenadas que enviamos.
    waypoints.forEach((wp: any, i: number) => {
      // Pula a garagem
      if (i === 0) return; 
      
      const clientIndex = i - 1; // Index no nosso array de clientes originais
      const clientId = clients[clientIndex].id;
      
      optimizedSequence.push({
        clientId,
        sequence: wp.waypoint_index // A posição que este cliente ficou na viagem
      });
    });

    return optimizedSequence;
  } catch (error) {
    console.error('Erro ao otimizar rota:', error);
    throw error;
  }
}
