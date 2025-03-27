interface TeamAddress {
    name: string;
    address: string | null;
    geocode: {
      lat: number, 
      lng: number
    };
  }
  
  interface Data {
    [key: string]: TeamAddress;
  }

  export type { TeamAddress, Data };