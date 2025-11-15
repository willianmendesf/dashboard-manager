-- Inserir na tabela principal
INSERT INTO tasks (name, schedule, enabled, development, monitor, monitor_groups, endpoint, retries, timeout)
VALUES ('Oracao360-Auto', '0 */3 * * *', TRUE, FALSE, TRUE, TRUE, 'http://localhost:13400/api/v1/prayer', 2, 30000);

INSERT INTO task_monitor_numbers (task_id, number)
VALUES (1, '5511966152161@c.us'), (1, '5511943947514@c.us');

INSERT INTO task_monitor_group_ids (task_id, group_id)
VALUES (1, '120363419667302902@g.us');
