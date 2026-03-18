-- Limpar dados anteriores para evitar duplicação
DELETE FROM bancada_sistemas;
DELETE FROM schemas_sql;
DELETE FROM sistemas;
DELETE FROM bancadas;

-- Inserir Bancadas
INSERT INTO bancadas (id, nome) VALUES (1, 'BANCADA 1 - SAÚDE');
INSERT INTO bancadas (id, nome) VALUES (2, 'BANCADA 2 - TRIBUTOS');
INSERT INTO bancadas (id, nome) VALUES (3, 'BANCADA 3 - COMPRAS/LICITAÇÃO');
INSERT INTO bancadas (id, nome) VALUES (4, 'BANCADA 4 - CONTABILIDADE');
INSERT INTO bancadas (id, nome) VALUES (5, 'BANCADA 5 - RECURSOS HUMANOS');
INSERT INTO bancadas (id, nome) VALUES (6, 'ADMINISTRAÇÃO');

-- Inserir Sistemas
INSERT INTO sistemas (id, nome) VALUES (1, 'SAÚDE');
INSERT INTO sistemas (id, nome) VALUES (2, 'ASSISTÊNCIA SOCIAL');
INSERT INTO sistemas (id, nome) VALUES (3, 'ENSINO');
INSERT INTO sistemas (id, nome) VALUES (4, 'BIBLIOTECA');
INSERT INTO sistemas (id, nome) VALUES (5, 'FLOWDOCK');
INSERT INTO sistemas (id, nome) VALUES (6, 'TRIBUTOS');
INSERT INTO sistemas (id, nome) VALUES (7, 'OUVIDORIA');
INSERT INTO sistemas (id, nome) VALUES (8, 'PROTOCOLO');
INSERT INTO sistemas (id, nome) VALUES (9, 'COMPRAS, LICITAÇÃO, FROTAS, ALMOXARIFADO');
INSERT INTO sistemas (id, nome) VALUES (10, 'PATRIMÔNIO');
INSERT INTO sistemas (id, nome) VALUES (11, 'CONTABILIDADE');
INSERT INTO sistemas (id, nome) VALUES (12, 'CUSTOS');
INSERT INTO sistemas (id, nome) VALUES (13, 'TERCEIRO SETOR');
INSERT INTO sistemas (id, nome) VALUES (14, 'CONTROLE INTERNO');
INSERT INTO sistemas (id, nome) VALUES (15, 'GESTOR MUNICIPAL');
INSERT INTO sistemas (id, nome) VALUES (16, 'DOCUMENTOS ELETRÔNICOS');
INSERT INTO sistemas (id, nome) VALUES (17, 'FOLHA DE PAGAMENTO');

-- Associar Sistemas às Bancadas
-- BANCADA 1: Saúde, Social, Ensino, Biblioteca, Flowdock
INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- BANCADA 2: Tributos, Ouvidoria, Protocolo, Flowdock
INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (2, 6), (2, 7), (2, 8), (2, 5);

-- BANCADA 3: Compras/Licitação, Patrimônio, Flowdock
INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (3, 9), (3, 10), (3, 5);

-- BANCADA 4: Contabilidade, Custos, Terceiro Setor, Controle Interno, Gestor, Documentos, Flowdock
INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16), (4, 5);

-- BANCADA 5: Folha, Flowdock
INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (5, 17), (5, 5);

-- ADMINISTRAÇÃO: (Pode ver tudo ou específicos, vamos associar todos por padrão)
INSERT INTO bancada_sistemas (bancada_id, sistema_id) SELECT 6, id FROM sistemas;
