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

class Team {
  private number: string;
  private name: string;
  private address: string;

  constructor(number: string, name: string, address: string) {
    this.number = number;
    this.name = name;
    this.address = address;
  }

  public getNumber(): string {
    return this.number;
  }

  public getName(): string {
    return this.name;
  }

  public getAddress(): string {
    return this.address;
  }
}

export type { TeamAddress, AddressData, DrpData };
export { Team };