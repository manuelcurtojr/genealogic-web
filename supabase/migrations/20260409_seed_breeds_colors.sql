-- Seed breeds and colors for Genealogic
-- Only inserts if not already present (ON CONFLICT DO NOTHING)

-- ══════════════════════════════════════
-- RAZAS DE PERROS (100+ más comunes)
-- ══════════════════════════════════════

INSERT INTO breeds (name) VALUES
-- Grupo 1: Pastores y Boyeros
('Pastor Alemán'), ('Pastor Belga Malinois'), ('Pastor Belga Tervuren'), ('Pastor Belga Groenendael'),
('Pastor Australiano'), ('Border Collie'), ('Collie'), ('Shetland Sheepdog'),
('Antiguo Pastor Inglés'), ('Pastor de Brie'), ('Boyero de Berna'), ('Boyero de Flandes'),
('Corgi Galés de Pembroke'), ('Corgi Galés de Cardigan'), ('Pastor Blanco Suizo'),
-- Grupo 2: Pinscher, Schnauzer, Molosoides
('Schnauzer Miniatura'), ('Schnauzer Estándar'), ('Schnauzer Gigante'),
('Doberman'), ('Rottweiler'), ('Bóxer'), ('Gran Danés'), ('Bullmastiff'),
('Mastín Napolitano'), ('Mastín Español'), ('Dogo Argentino'), ('Dogo de Burdeos'),
('Cane Corso'), ('Fila Brasileiro'), ('Presa Canario'), ('San Bernardo'),
('Terranova'), ('Leonberger'), ('Shar Pei'), ('Bulldog Inglés'), ('Bulldog Francés'),
-- Grupo 3: Terriers
('Bull Terrier'), ('Staffordshire Bull Terrier'), ('American Staffordshire Terrier'),
('American Pit Bull Terrier'), ('Jack Russell Terrier'), ('Yorkshire Terrier'),
('West Highland White Terrier'), ('Scottish Terrier'), ('Airedale Terrier'),
('Fox Terrier'), ('Kerry Blue Terrier'), ('Bedlington Terrier'),
-- Grupo 4: Teckels
('Teckel Estándar'), ('Teckel Miniatura'), ('Teckel Kaninchen'),
-- Grupo 5: Spitz y Primitivos
('Akita Inu'), ('Akita Americano'), ('Shiba Inu'), ('Husky Siberiano'),
('Malamute de Alaska'), ('Samoyedo'), ('Chow Chow'), ('Spitz Alemán'),
('Pomerania'), ('Basenji'), ('Shikoku'),
-- Grupo 6: Sabuesos y Rastreo
('Beagle'), ('Basset Hound'), ('Bloodhound'), ('Dálmata'), ('Rhodesian Ridgeback'),
-- Grupo 7: Perros de Muestra
('Pointer Inglés'), ('Setter Inglés'), ('Setter Irlandés'), ('Braco Alemán'),
('Braco de Weimar'), ('Vizsla'), ('Brittany'), ('Epagneul Bretón'),
-- Grupo 8: Cobradores y Levantadores
('Labrador Retriever'), ('Golden Retriever'), ('Cocker Spaniel Inglés'),
('Cocker Spaniel Americano'), ('Springer Spaniel Inglés'), ('Flat-Coated Retriever'),
('Nova Scotia Duck Tolling Retriever'), ('Chesapeake Bay Retriever'),
-- Grupo 9: Compañía
('Caniche Toy'), ('Caniche Miniatura'), ('Caniche Mediano'), ('Caniche Estándar'),
('Bichón Frisé'), ('Bichón Maltés'), ('Bichón Habanero'),
('Chihuahua'), ('Papillón'), ('Cavalier King Charles Spaniel'),
('Pug'), ('Shih Tzu'), ('Lhasa Apso'), ('Pekinés'),
('Boston Terrier'), ('Coton de Tuléar'),
-- Grupo 10: Lebreles
('Galgo Español'), ('Greyhound'), ('Whippet'), ('Borzoi'),
('Galgo Afgano'), ('Saluki'), ('Galgo Italiano'),
-- Otras razas populares
('Crestado Chino'), ('Xoloitzcuintle'), ('Perro de Agua Español'),
('Perro de Agua Portugués'), ('Lagotto Romagnolo'), ('Australian Cattle Dog'),
('Staffordshire Terrier Americano'), ('Alaskan Klee Kai'), ('Pomerania Miniatura')
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════
-- COLORES DE PERROS
-- ══════════════════════════════════════

INSERT INTO colors (name) VALUES
-- Sólidos
('Negro'), ('Blanco'), ('Crema'), ('Rojo'), ('Marrón'), ('Chocolate'),
('Canela'), ('Leonado'), ('Dorado'), ('Arena'), ('Gris'), ('Azul'),
('Plateado'), ('Hígado'), ('Isabela'), ('Lila'),
-- Bicolores y patrones
('Negro y fuego'), ('Negro y blanco'), ('Marrón y fuego'),
('Blanco y negro'), ('Blanco y marrón'), ('Blanco y leonado'),
('Rojo y blanco'), ('Azul y fuego'), ('Hígado y fuego'),
-- Tricolores
('Tricolor'), ('Tricolor merle'),
-- Merle / Arlequín
('Merle azul'), ('Merle rojo'), ('Merle chocolate'),
('Arlequín'), ('Atigrado'),
-- Atigrados
('Atigrado oscuro'), ('Atigrado claro'), ('Atigrado reverso'),
-- Particolores
('Particolor'), ('Piebald'), ('Pinto'),
-- Patrones especiales
('Sable'), ('Sable oscuro'), ('Sable claro'),
('Manto negro'), ('Bicolor'), ('Capa de lobo'),
('Rubio'), ('Apricot'), ('Cervato'), ('Trigo'),
-- Degradados y raros
('Gris lobo'), ('Gris azulado'), ('Crema oscuro'),
('Rojo irlandés'), ('Caoba'), ('Bermejo'),
('Fuego'), ('Sal y pimienta'), ('Negro sólido'), ('Blanco puro')
ON CONFLICT (name) DO NOTHING;
