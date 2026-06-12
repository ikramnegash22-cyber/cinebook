/**
 * CineBook – data.js
 * Mock-Daten direkt in JS eingebettet (funktioniert ohne Server/fetch)
 * Daten werden auf window-Objekt gesetzt fuer globalen Zugriff
 */

(function() {
  /* ---- HILFSFUNKTIONEN ---- */
  function vip10() { return ['vip','vip','vip','vip','vip','vip','vip','vip','vip','vip']; }
  var av = 'available', bk = 'booked';
  var F = [av,av,av,av,av,av,av,av,av,av]; // alle frei
  var X = [bk,bk,bk,bk,bk,bk,bk,bk,bk,bk]; // alle besetzt

  function s8(A,B,C,D,E,F2,G) {
    return {rows:['A','B','C','D','E','F','G','H'],seatsPerRow:10,
      layout:{A:A,B:B,C:C,D:D,E:E,F:F2,G:G,H:vip10()}};
  }
  function s10(A,B,C,D,E,F2,G,H,I) {
    return {rows:['A','B','C','D','E','F','G','H','I','J'],seatsPerRow:10,
      layout:{A:A,B:B,C:C,D:D,E:E,F:F2,G:G,H:H,I:I,J:vip10()}};
  }

  /* ---- FILME ---- */
  // TMDB Bilder - direkt via API mit Key
  var TMDB_KEY = '21d1191c3b8b8f832bc896d8b0f40beb';
  var TMDB_BASE = 'https://image.tmdb.org/t/p/w500';

  // Verifizierte TMDB Poster-IDs (TMDB Film-IDs)
  // Format: https://api.tmdb.org/3/movie/{id}/images?api_key=...
  function tmdbPoster(path) {
    return TMDB_BASE + path;
  }

  window.MOVIES_DATA = [
    {id:1,title:'Inception',genre:['Sci-Fi','Thriller'],duration:148,rating:'PG-13',
     description:'Ein Dieb stiehlt Geheimnisse aus dem Unterbewusstsein und bekommt eine letzte Chance.',
     director:'Christopher Nolan',cast:['Leonardo DiCaprio','Joseph Gordon-Levitt','Tom Hardy'],
     releaseDate:'2010-07-16',
     poster:'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
     trailer:'https://www.youtube.com/watch?v=YoHD9XEInc0',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:12.50,student:9.00,senior:9.00,vip:18.00}},
    {id:2,title:'The Dark Knight',genre:['Action','Drama','Crime'],duration:152,rating:'PG-13',
     description:'Batman stellt sich dem Joker, der Chaos in Gotham verbreitet.',
     director:'Christopher Nolan',cast:['Christian Bale','Heath Ledger','Aaron Eckhart'],
     releaseDate:'2008-07-18',
     poster:'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
     trailer:'https://www.youtube.com/watch?v=EXeTwQWrcwY',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:12.50,student:9.00,senior:9.00,vip:18.00}},
    {id:3,title:'Interstellar',genre:['Sci-Fi','Adventure','Drama'],duration:169,rating:'PG-13',
     description:'Astronauten reisen durch ein Wurmloch auf der Suche nach einem neuen Heimatplaneten.',
     director:'Christopher Nolan',cast:['Matthew McConaughey','Anne Hathaway','Jessica Chastain'],
     releaseDate:'2014-11-07',
     poster:'https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
     trailer:'https://www.youtube.com/watch?v=zSWdZVtXT7E',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:12.50,student:9.00,senior:9.00,vip:18.00}},
    {id:4,title:'Avengers: Endgame',genre:['Action','Sci-Fi','Adventure'],duration:181,rating:'PG-13',
     description:'Die Avengers versuchen die von Thanos zerstoerte Welt wiederherzustellen.',
     director:'Anthony Russo',cast:['Robert Downey Jr.','Chris Evans','Mark Ruffalo','Scarlett Johansson'],
     releaseDate:'2019-04-26',
     poster:'https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
     trailer:'https://www.youtube.com/watch?v=TcMBFSGVi1c',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:13.50,student:10.00,senior:10.00,vip:20.00}},
    {id:5,title:'Der Pate',genre:['Drama','Crime'],duration:175,rating:'R',
     description:'Die Corleone-Familie kaempft nach einem Attentat ums Ueberleben.',
     director:'Francis Ford Coppola',cast:['Marlon Brando','Al Pacino','James Caan'],
     releaseDate:'1972-03-24',
     poster:'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
     trailer:'https://www.youtube.com/watch?v=sY1S34973zA',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:11.00,student:8.00,senior:8.00,vip:16.00}},
    {id:6,title:'Pulp Fiction',genre:['Crime','Drama','Thriller'],duration:154,rating:'R',
     description:'Die Wege von Kriminellen, einem Boxer und Auftragskillern kreuzen sich in L.A.',
     director:'Quentin Tarantino',cast:['John Travolta','Uma Thurman','Samuel L. Jackson','Bruce Willis'],
     releaseDate:'1994-10-14',
     poster:'https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
     trailer:'https://www.youtube.com/watch?v=s7EdQ4FqbhY',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:11.00,student:8.00,senior:8.00,vip:16.00}},
    {id:7,title:'The Matrix',genre:['Sci-Fi','Action','Thriller'],duration:136,rating:'R',
     description:'Ein Hacker entdeckt, dass die Realitaet eine Simulation ist.',
     director:'Lana Wachowski',cast:['Keanu Reeves','Laurence Fishburne','Carrie-Anne Moss'],
     releaseDate:'1999-03-31',
     poster:'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
     trailer:'https://www.youtube.com/watch?v=vKQi3bBA1y8',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:11.00,student:8.00,senior:8.00,vip:16.00}},
    {id:8,title:'Oppenheimer',genre:['Drama','History','Thriller'],duration:180,rating:'R',
     description:'Die Geschichte des Physikers, der die erste Atombombe entwickelte.',
     director:'Christopher Nolan',cast:['Cillian Murphy','Emily Blunt','Matt Damon','Robert Downey Jr.'],
     releaseDate:'2023-07-21',
     poster:'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
     trailer:'https://www.youtube.com/watch?v=uYPbbksJxIg',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:14.00,student:10.50,senior:10.50,vip:21.00}},
    {id:9,title:'Barbie',genre:['Comedy','Adventure','Fantasy'],duration:114,rating:'PG-13',
     description:'Barbie verlaesst Barbieland und entdeckt die reale Welt.',
     director:'Greta Gerwig',cast:['Margot Robbie','Ryan Gosling','America Ferrera'],
     releaseDate:'2023-07-21',
     poster:'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
     trailer:'https://www.youtube.com/watch?v=pBk4NYhWNMM',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:13.50,student:10.00,senior:10.00,vip:20.00}},
    {id:10,title:'Dune: Part Two',genre:['Sci-Fi','Adventure','Drama'],duration:166,rating:'PG-13',
     description:'Paul Atreides fuehrt einen heiligen Krieg auf Arrakis.',
     director:'Denis Villeneuve',cast:['Timothee Chalamet','Zendaya','Rebecca Ferguson'],
     releaseDate:'2024-03-01',
     poster:'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
     trailer:'https://www.youtube.com/watch?v=Way9Dexny3w',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:14.00,student:10.50,senior:10.50,vip:21.00}},
    {id:11,title:'Spider-Man: No Way Home',genre:['Action','Adventure','Sci-Fi'],duration:148,rating:'PG-13',
     description:'Peter Parker oeffnet das Multiversum fuer gefaehrliche Feinde.',
     director:'Jon Watts',cast:['Tom Holland','Zendaya','Benedict Cumberbatch','Willem Dafoe'],
     releaseDate:'2021-12-17',
     poster:'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
     trailer:'https://www.youtube.com/watch?v=rt-2cxAiPJk',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:13.50,student:10.00,senior:10.00,vip:20.00}},
    {id:12,title:'Poor Things',genre:['Comedy','Drama','Romance'],duration:141,rating:'R',
     description:'Bella Baxter entdeckt nach ihrer Wiedergeburt die Welt.',
     director:'Yorgos Lanthimos',cast:['Emma Stone','Mark Ruffalo','Willem Dafoe'],
     releaseDate:'2023-12-08',
     poster:'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
     trailer:'https://www.youtube.com/watch?v=RlbR5N6veqw',
     language:'Englisch',subtitles:['Deutsch','Englisch'],price:{normal:13.00,student:9.50,senior:9.50,vip:19.00}}
  ];

  /* ---- SPIELZEITEN ---- */
  window.SHOWTIMES_DATA = [
    {id:1,movieId:1,date:'2026-06-13',time:'14:00',hall:'Saal 1',totalSeats:80,availableSeats:45,format:'2D',language:'OV',accessible:true,
     seats:s8([av,av,av,av,av,av,av,av,'accessible','accessible'],[av,av,bk,bk,av,av,bk,av,av,av],[av,bk,bk,av,av,av,av,bk,av,av],[av,av,av,av,bk,bk,av,av,av,av],[bk,av,av,av,av,av,av,av,bk,av],[av,av,av,bk,av,av,av,av,av,av],[av,av,av,av,av,bk,bk,av,av,av])},
    {id:2,movieId:1,date:'2026-06-13',time:'17:30',hall:'Saal 2',totalSeats:80,availableSeats:62,format:'2D',language:'Deutsch',accessible:false,
     seats:s8(F,[av,av,av,bk,av,av,av,av,av,av],F,[av,av,av,av,av,bk,av,av,av,av],F,[av,av,bk,av,av,av,av,av,av,av],F)},
    {id:3,movieId:1,date:'2026-06-13',time:'21:00',hall:'Saal 1',totalSeats:80,availableSeats:5,format:'2D',language:'OV',accessible:false,
     seats:s8(X,X,X,X,X,X,[av,av,bk,bk,bk,bk,bk,av,bk,bk])},
    {id:4,movieId:2,date:'2026-06-13',time:'20:00',hall:'Saal 3',totalSeats:100,availableSeats:70,format:'IMAX',language:'OV',accessible:true,
     seats:s10(F,[av,av,bk,av,av,av,bk,av,av,av],F,[av,bk,av,av,av,av,av,bk,av,av],[av,av,av,av,bk,bk,av,av,av,av],F,[bk,av,av,av,av,av,av,av,bk,av],[av,av,av,bk,av,av,av,av,av,av],['accessible','accessible',av,av,av,av,av,av,av,av])},
    {id:5,movieId:2,date:'2026-06-14',time:'15:30',hall:'Saal 3',totalSeats:100,availableSeats:88,format:'IMAX',language:'Deutsch',accessible:false,
     seats:s10(F,F,[av,av,av,bk,av,av,av,av,av,av],F,F,[av,bk,av,av,av,av,bk,av,av,av],F,F,F)},
    {id:6,movieId:3,date:'2026-06-14',time:'15:00',hall:'Saal 1',totalSeats:80,availableSeats:55,format:'2D',language:'Deutsch',accessible:true,
     seats:s8([av,av,av,av,av,av,av,av,'accessible','accessible'],[bk,bk,av,av,av,av,av,av,bk,bk],[av,av,av,bk,av,av,bk,av,av,av],F,[av,bk,av,av,av,av,av,av,bk,av],[av,av,av,av,bk,bk,av,av,av,av],F)},
    {id:7,movieId:3,date:'2026-06-14',time:'19:30',hall:'Saal 2',totalSeats:80,availableSeats:72,format:'2D',language:'OV',accessible:false,
     seats:s8(F,F,[av,av,av,av,bk,av,av,av,av,av],F,[av,av,bk,av,av,av,av,bk,av,av],F,F)},
    {id:8,movieId:4,date:'2026-06-14',time:'19:00',hall:'Saal 3',totalSeats:100,availableSeats:30,format:'IMAX',language:'Deutsch',accessible:false,
     seats:s10([bk,bk,bk,av,av,av,bk,bk,bk,bk],[bk,av,bk,bk,av,av,bk,av,bk,bk],[av,bk,bk,bk,bk,bk,bk,bk,av,bk],[bk,bk,av,bk,bk,bk,bk,av,bk,bk],[bk,bk,bk,bk,av,av,bk,bk,bk,bk],[av,bk,bk,bk,bk,bk,bk,bk,av,bk],[bk,bk,bk,av,bk,bk,av,bk,bk,bk],[bk,av,bk,bk,bk,bk,bk,av,bk,bk],[av,bk,bk,bk,bk,bk,bk,bk,bk,av])},
    {id:9,movieId:5,date:'2026-06-15',time:'18:00',hall:'Saal 2',totalSeats:80,availableSeats:65,format:'2D',language:'OV',
     seats:s8(F,F,[av,av,bk,av,av,bk,av,av,av,av],F,[av,bk,av,av,av,av,av,bk,av,av],F,[av,av,av,bk,bk,av,av,av,av,av])},
    {id:10,movieId:6,date:'2026-06-15',time:'20:30',hall:'Saal 1',totalSeats:80,availableSeats:58,format:'2D',language:'OV',
     seats:s8(F,[av,bk,av,av,bk,av,av,av,av,av],[av,av,av,bk,bk,av,av,av,av,av],[bk,av,av,av,av,av,av,av,bk,av],[av,av,av,av,av,bk,av,av,av,av],[av,av,bk,av,av,av,av,bk,av,av],F)},
    {id:11,movieId:7,date:'2026-06-15',time:'16:00',hall:'Saal 2',totalSeats:80,availableSeats:74,format:'2D',language:'OV',
     seats:s8(F,F,F,[av,av,bk,av,av,av,bk,av,av,av],F,[av,av,av,bk,av,bk,av,av,av,av],F)},
    {id:12,movieId:8,date:'2026-06-13',time:'13:00',hall:'Saal 3',totalSeats:100,availableSeats:82,format:'IMAX',language:'OV',
     seats:s10(F,F,[av,av,bk,av,av,av,av,bk,av,av],F,F,[av,bk,av,av,bk,av,av,av,av,av],F,F,F)},
    {id:13,movieId:8,date:'2026-06-14',time:'17:00',hall:'Saal 3',totalSeats:100,availableSeats:45,format:'IMAX',language:'Deutsch',
     seats:s10(F,[bk,bk,av,av,bk,bk,av,av,bk,bk],[av,av,bk,bk,av,av,bk,bk,av,av],[bk,av,av,bk,av,bk,av,av,bk,av],[av,bk,bk,av,av,av,av,bk,bk,av],[bk,bk,av,av,bk,bk,av,av,bk,bk],[av,av,av,bk,av,av,bk,av,av,av],[bk,av,bk,av,bk,av,bk,av,bk,av],F)},
    {id:14,movieId:9,date:'2026-06-13',time:'16:00',hall:'Saal 2',totalSeats:80,availableSeats:52,format:'2D',language:'Deutsch',
     seats:s8(F,[av,av,bk,bk,av,av,bk,bk,av,av],[bk,av,av,av,av,av,av,av,av,bk],[av,av,av,bk,bk,bk,bk,av,av,av],[av,bk,av,av,av,av,av,av,bk,av],[av,av,av,av,bk,bk,av,av,av,av],F)},
    {id:15,movieId:9,date:'2026-06-15',time:'14:30',hall:'Saal 1',totalSeats:80,availableSeats:70,format:'2D',language:'Deutsch',
     seats:s8(F,F,[av,av,av,bk,av,av,av,av,av,av],F,[av,av,bk,av,av,av,av,av,av,av],F,[av,av,av,av,bk,bk,av,av,av,av])},
    {id:16,movieId:10,date:'2026-06-13',time:'18:30',hall:'Saal 3',totalSeats:100,availableSeats:38,format:'IMAX',language:'OV',
     seats:s10([bk,bk,av,av,bk,bk,av,av,bk,bk],[av,bk,bk,av,bk,bk,av,bk,bk,av],[bk,av,bk,bk,av,av,bk,bk,av,bk],[av,bk,av,bk,bk,bk,bk,av,bk,av],[bk,bk,bk,av,bk,bk,av,bk,bk,bk],[av,av,bk,bk,av,av,bk,bk,av,av],[bk,bk,av,bk,bk,av,bk,bk,av,bk],[av,bk,bk,av,bk,bk,av,bk,bk,av],[bk,av,bk,bk,av,av,bk,bk,av,bk])},
    {id:17,movieId:10,date:'2026-06-15',time:'19:00',hall:'Saal 3',totalSeats:100,availableSeats:91,format:'IMAX',language:'Deutsch',
     seats:s10(F,F,F,[av,av,av,bk,av,av,bk,av,av,av],F,F,[av,bk,av,av,av,av,av,bk,av,av],F,F)},
    {id:18,movieId:11,date:'2026-06-13',time:'15:00',hall:'Saal 1',totalSeats:80,availableSeats:43,format:'2D',language:'Deutsch',
     seats:s8(F,[bk,bk,av,av,bk,bk,av,av,bk,bk],[av,av,bk,bk,av,av,bk,bk,av,av],[bk,av,av,av,bk,bk,av,av,av,bk],[av,av,bk,av,av,av,av,bk,av,av],[bk,bk,av,bk,av,av,bk,av,bk,bk],F)},
    {id:19,movieId:12,date:'2026-06-14',time:'20:00',hall:'Saal 2',totalSeats:80,availableSeats:67,format:'2D',language:'OV',
     seats:s8(F,F,[av,bk,av,av,av,av,av,bk,av,av],[av,av,av,av,bk,av,av,av,av,av],F,[av,av,bk,bk,av,av,av,av,av,av],F)},
    {id:20,movieId:12,date:'2026-06-15',time:'17:00',hall:'Saal 1',totalSeats:80,availableSeats:80,format:'2D',language:'Deutsch',
     seats:s8(F,F,F,F,F,F,F)}
  ];

  /* ---- BENUTZER ---- */
  window.USERS_DATA = [
    {id:1,username:'admin',password:'admin123',email:'admin@cinema.de',role:'admin',firstName:'Max',lastName:'Mustermann',createdAt:'2025-01-01',active:true,bookings:[]},
    {id:2,username:'clerk1',password:'clerk123',email:'clerk1@cinema.de',role:'clerk',firstName:'Anna',lastName:'Schmidt',createdAt:'2025-01-15',active:true,bookings:[]},
    {id:3,username:'clerk2',password:'clerk456',email:'clerk2@cinema.de',role:'clerk',firstName:'Peter',lastName:'Mueller',createdAt:'2025-02-01',active:true,bookings:[]},
    {id:4,username:'user1',password:'user123',email:'user1@example.de',role:'customer',firstName:'Lisa',lastName:'Weber',createdAt:'2025-03-10',active:true,bookings:[
      {bookingId:'BK-001',showtimeId:1,movieId:1,movieTitle:'Inception',date:'2026-06-13',time:'14:00',hall:'Saal 1',format:'2D',seats:['B3','B4'],ticketType:'normal',totalPrice:25.00,bookedAt:'2026-06-10T14:23:00',status:'confirmed',userName:'Lisa Weber'},
      {bookingId:'BK-004',showtimeId:8,movieId:4,movieTitle:'Avengers: Endgame',date:'2026-06-14',time:'19:00',hall:'Saal 3',format:'IMAX',seats:['E5','E6'],ticketType:'normal',totalPrice:27.00,bookedAt:'2026-06-11T09:15:00',status:'confirmed',userName:'Lisa Weber'}
    ]},
    {id:5,username:'user2',password:'user456',email:'user2@example.de',role:'customer',firstName:'Tom',lastName:'Fischer',createdAt:'2025-04-05',active:true,bookings:[
      {bookingId:'BK-002',showtimeId:4,movieId:2,movieTitle:'The Dark Knight',date:'2026-06-13',time:'20:00',hall:'Saal 3',format:'IMAX',seats:['D2','D3','D4'],ticketType:'student',totalPrice:27.00,bookedAt:'2026-06-09T18:45:00',status:'confirmed',userName:'Tom Fischer'}
    ]},
    {id:6,username:'user3',password:'user789',email:'user3@example.de',role:'customer',firstName:'Maria',lastName:'Braun',createdAt:'2025-05-20',active:true,bookings:[
      {bookingId:'BK-003',showtimeId:16,movieId:10,movieTitle:'Dune: Part Two',date:'2026-06-13',time:'18:30',hall:'Saal 3',format:'IMAX',seats:['C5','C6'],ticketType:'normal',totalPrice:28.00,bookedAt:'2026-06-08T11:30:00',status:'confirmed',userName:'Maria Braun'}
    ]},
    {id:7,username:'user4',password:'pass123',email:'user4@example.de',role:'customer',firstName:'Jonas',lastName:'Klein',createdAt:'2025-06-01',active:true,bookings:[
      {bookingId:'BK-006',showtimeId:18,movieId:11,movieTitle:'Spider-Man: No Way Home',date:'2026-06-13',time:'15:00',hall:'Saal 1',format:'2D',seats:['A1','A2','A3'],ticketType:'student',totalPrice:30.00,bookedAt:'2026-06-12T08:00:00',status:'confirmed',userName:'Jonas Klein'}
    ]},
    {id:8,username:'user5',password:'pass456',email:'user5@example.de',role:'customer',firstName:'Sophie',lastName:'Wagner',createdAt:'2025-07-15',active:false,bookings:[]}
  ];

  console.log('CineBook Daten geladen:', window.MOVIES_DATA.length, 'Filme,', window.SHOWTIMES_DATA.length, 'Spielzeiten');
})();
