interface TeamAddress {
    name: string;
    address: string | null;
    geocode: {
      lat: number, 
      lng: number
    };
  }
  
interface AddressData {
  [key: string]: TeamAddress;
}

interface DrpData {
  drp: number
}

export type { TeamAddress, AddressData, DrpData};