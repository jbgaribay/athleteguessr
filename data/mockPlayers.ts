export interface Player {
    id: string;
    name: string;
    position: string;
    team: string;
    yearsActive: string;
    birthCity: string;
    birthState: string;
    latitude: number;
    longitude: number;
    photoUrl?: string;
    cityFact: string;
  }
  
  export const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Tom Brady',
      position: 'QB',
      team: 'Tampa Bay Buccaneers',
      yearsActive: '2000-2022',
      birthCity: 'San Mateo',
      birthState: 'California',
      latitude: 37.5630,
      longitude: -122.3255,
      cityFact: 'San Mateo is part of Silicon Valley and is home to over 100,000 residents in the San Francisco Bay Area.'
    },
    {
      id: '2',
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'Kansas City Chiefs',
      yearsActive: '2017-present',
      birthCity: 'Tyler',
      birthState: 'Texas',
      latitude: 32.3513,
      longitude: -95.3011,
      cityFact: 'Known as the "Rose Capital of America", Tyler grows more than 20% of the commercial rose bushes in the U.S.'
    },
    {
      id: '3',
      name: 'Joe Montana',
      position: 'QB',
      team: 'San Francisco 49ers',
      yearsActive: '1979-1994',
      birthCity: 'New Eagle',
      birthState: 'Pennsylvania',
      latitude: 40.2034,
      longitude: -79.9517,
      cityFact: 'A small borough in Washington County with a population under 2,000, New Eagle is located along the Monongahela River south of Pittsburgh.'
    },
    {
      id: '4',
      name: 'Peyton Manning',
      position: 'QB',
      team: 'Denver Broncos',
      yearsActive: '1998-2015',
      birthCity: 'New Orleans',
      birthState: 'Louisiana',
      latitude: 29.9511,
      longitude: -90.0715,
      cityFact: 'The birthplace of jazz music, New Orleans is famous for its vibrant music scene, Creole cuisine, and annual Mardi Gras celebration.'
    },
    {
      id: '5',
      name: 'Jerry Rice',
      position: 'WR',
      team: 'San Francisco 49ers',
      yearsActive: '1985-2004',
      birthCity: 'Starkville',
      birthState: 'Mississippi',
      latitude: 33.4504,
      longitude: -88.8184,
      cityFact: 'Home to Mississippi State University, Starkville is known for its college town atmosphere and Southern hospitality.'
    }
  ];