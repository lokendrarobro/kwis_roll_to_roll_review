const create_kwis_role_permission_table = `CREATE TABLE IF NOT EXISTS kwis_role_permission (
    id BIGINT(20) AUTO_INCREMENT,
    feature_list_id BIGINT(20) NOT NULL,
    role_id BIGINT(20) NOT NULL,
    PRIMARY KEY (id)
);`;

const create_kwis_role_permission_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_role_permission_sync_log (
    id BIGINT AUTO_INCREMENT NOT NULL,
    role_permission_id INT NOT NULL,
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id),
    UNIQUE INDEX unique_role_permission_id(role_permission_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_permission_insert
    AFTER INSERT ON kwis_role_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_permission_sync_log (role_permission_id, operation_type, status)
        VALUES (NEW.id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_permission_update
    AFTER UPDATE ON kwis_role_permission
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_role_permission_sync_log (role_permission_id, operation_type, status)
        VALUES (NEW.id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_role_permission_delete
//     AFTER DELETE ON kwis_role_permission
//     FOR EACH ROW
//     BEGIN
//         INSERT INTO kwis_role_permission_sync_log (role_permission_id, operation_type, status)
//         VALUES (OLD.id, 'DELETE', 'PENDING');
//     END;`;

module.exports = {
  create_kwis_role_permission_table,
  create_kwis_role_permission_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
//   create_delete_trigger,
};
