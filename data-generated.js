var countryArray = [
  "China",
  "Denmark",
  "Denmark/Sweden",
  "Finland",
  "Netherlands",
  "United States"
];
var eventArray = [
  "Athletics",
  "Badminton",
  "Basketball",
  "Biathlon",
  "Cross Country Skiing",
  "Football",
  "Gymnastics",
  "Ice Hockey",
  "Judo",
  "Sailing",
  "Speed Skating",
  "Swimming",
  "Tug-Of-War"
];
var ageArray = [18, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34];
var yearArray = [1900, 1912, 1920, 1924, 1932, 1948, 1952, 1980, 1988, 1992, 1994, 1996, 2000, 2002, 2012, 2014];

// Schema: [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], [Ages], [Years], Games, Season, City, [Events]]
var olympianArray = [
  [180, 80, "a_dijiang", ["A", "Dijiang"], 0, 0, 0, 0, 2, "CHN", "M", [], [24], [1992], "1992 Summer", "Summer", "Barcelona", ["Basketball Men's Basketball"]],
  [170, 60, "a_lamusi", ["A", "Lamusi"], 0, 0, 0, 0, 8, "CHN", "M", [], [23], [2012], "2012 Summer", "Summer", "London", ["Judo Men's Extra-Lightweight"]],
  [null, null, "gunnar_nielsen_aaby", ["Gunnar", "Nielsen Aaby"], 0, 0, 0, 1, 5, "DEN", "M", [], [24], [1920], "1920 Summer", "Summer", "Antwerpen", ["Football Men's Football"]],
  [null, null, "edgar_lindenau_aabye", ["Edgar", "Lindenau Aabye"], 1, 0, 0, 2, 12, "DEN", "M", [["Tug-Of-War Men's Tug-Of-War", "gold"]], [34], [1900], "1900 Summer", "Summer", "Paris", ["Tug-Of-War Men's Tug-Of-War"]],
  [185, 82, "christine_jacoba_aaftink", ["Christine", "Jacoba Aaftink"], 0, 0, 0, 4, 10, "NED", "F", [], [21, 25, 27], [1988, 1992, 1994], "1988 Winter", "Winter", "Calgary", ["Speed Skating Women's 1,000 metres", "Speed Skating Women's 500 metres"]],
  [188, 75, "per_knut_aaland", ["Per", "Knut Aaland"], 0, 0, 0, 5, 4, "USA", "M", [], [31, 33], [1992, 1994], "1992 Winter", "Winter", "Albertville", ["Cross Country Skiing Men's 10 kilometres", "Cross Country Skiing Men's 10/15 kilometres Pursuit", "Cross Country Skiing Men's 30 kilometres", "Cross Country Skiing Men's 4 x 10 kilometres Relay", "Cross Country Skiing Men's 50 kilometres"]],
  [183, 72, "john_aalberg", ["John", "Aalberg"], 0, 0, 0, 5, 4, "USA", "M", [], [31, 33], [1992, 1994], "1992 Winter", "Winter", "Albertville", ["Cross Country Skiing Men's 10 kilometres", "Cross Country Skiing Men's 10/15 kilometres Pursuit", "Cross Country Skiing Men's 30 kilometres", "Cross Country Skiing Men's 4 x 10 kilometres Relay", "Cross Country Skiing Men's 50 kilometres"]],
  [168, null, "cornelia_cor_aalten_strannood", ["Cornelia", "\"Cor\" Aalten (-Strannood)"], 0, 0, 0, 4, 0, "NED", "F", [], [18], [1932], "1932 Summer", "Summer", "Los Angeles", ["Athletics Women's 100 metres", "Athletics Women's 4 x 100 metres Relay"]],
  [186, 96, "antti_sami_aalto", ["Antti", "Sami Aalto"], 0, 0, 0, 3, 7, "FIN", "M", [], [26], [2002], "2002 Winter", "Winter", "Salt Lake City", ["Ice Hockey Men's Ice Hockey"]],
  [null, null, "einar_ferdinand_einari_aalto", ["Einar", "Ferdinand \"Einari\" Aalto"], 0, 0, 0, 3, 11, "FIN", "M", [], [26], [1952], "1952 Summer", "Summer", "Helsinki", ["Swimming Men's 400 metres Freestyle"]],
  [182, 76.5, "jorma_ilmari_aalto", ["Jorma", "Ilmari Aalto"], 0, 0, 0, 3, 4, "FIN", "M", [], [22], [1980], "1980 Winter", "Winter", "Lake Placid", ["Cross Country Skiing Men's 30 kilometres"]],
  [172, 70, "jyri_tapani_aalto", ["Jyri", "Tapani Aalto"], 0, 0, 0, 3, 1, "FIN", "M", [], [31], [2000], "2000 Summer", "Summer", "Sydney", ["Badminton Men's Singles"]],
  [159, 55.5, "minna_maarit_aalto", ["Minna", "Maarit Aalto"], 0, 0, 0, 3, 9, "FIN", "F", [], [30, 34], [1996, 2000], "1996 Summer", "Summer", "Atlanta", ["Sailing Women's Windsurfer"]],
  [171, 65, "pirjo_hannele_aalto_mattila", ["Pirjo", "Hannele Aalto (Mattila-)"], 0, 0, 0, 3, 3, "FIN", "F", [], [32], [1994], "1994 Winter", "Winter", "Lillehammer", ["Biathlon Women's 7.5 kilometres Sprint"]],
  [null, null, "arvo_ossian_aaltonen", ["Arvo", "Ossian Aaltonen"], 0, 0, 2, 3, 11, "FIN", "M", [["Swimming Men's 200 metres Breaststroke", "bronze"], ["Swimming Men's 400 metres Breaststroke", "bronze"]], [22, 30, 34], [1912, 1920, 1924], "1912 Summer", "Summer", "Stockholm", ["Swimming Men's 200 metres Breaststroke", "Swimming Men's 400 metres Breaststroke"]],
  [184, 85, "juhamatti_tapio_aaltonen", ["Juhamatti", "Tapio Aaltonen"], 0, 0, 1, 3, 7, "FIN", "M", [["Ice Hockey Men's Ice Hockey", "bronze"]], [28], [2014], "2014 Winter", "Winter", "Sochi", ["Ice Hockey Men's Ice Hockey"]],
  [175, 64, "paavo_johannes_aaltonen", ["Paavo", "Johannes Aaltonen"], 3, 0, 1, 3, 6, "FIN", "M", [["Gymnastics Men's Individual All-Around", "bronze"], ["Gymnastics Men's Team All-Around", "gold"], ["Gymnastics Men's Horse Vault", "gold"], ["Gymnastics Men's Pommelled Horse", "gold"]], [28], [1948], "1948 Summer", "Summer", "London", ["Gymnastics Men's Floor Exercise", "Gymnastics Men's Horizontal Bar", "Gymnastics Men's Horse Vault", "Gymnastics Men's Individual All-Around", "Gymnastics Men's Parallel Bars", "Gymnastics Men's Pommelled Horse", "Gymnastics Men's Rings", "Gymnastics Men's Team All-Around"]]
];
