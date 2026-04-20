const create_kwis_role_table = `CREATE TABLE IF NOT EXISTS kwis_role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255),
    status INT);`;

const create_kwis_role_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_role_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    role_id INT NOT NULL COMMENT 'kwis_role(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_insert
    AFTER INSERT ON kwis_role
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_sync_log (role_id, operation_type, status)
        VALUES (NEW.role_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_update
    AFTER UPDATE ON kwis_role
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_sync_log (role_id, operation_type, status)
        VALUES (NEW.role_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_delete1
//     AFTER DELETE ON kwis_role_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_role WHERE role_id = OLD.role_id;
//     END`;

module.exports = {
  create_kwis_role_table,
  create_kwis_role_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
//   create_delete_trigger,
};
