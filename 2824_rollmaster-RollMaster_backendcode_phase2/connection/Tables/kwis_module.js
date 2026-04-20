const create_kwis_module_table = `CREATE TABLE IF NOT EXISTS kwis_module (
        module_id INT(11) AUTO_INCREMENT PRIMARY KEY,
        module_name VARCHAR(255),
        status INT(11)
    );`;

const create_kwis_module_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_module_sync_log (
        id INT AUTO_INCREMENT NOT NULL,
        module_id INT NOT NULL COMMENT 'kwis_module(id)',
        operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
        error_message VARCHAR(500),
        PRIMARY KEY (id)
    );`;

const create_insert_trigger = `  
    CREATE TRIGGER IF NOT EXISTS trg_kwis_module_insert
    AFTER INSERT ON kwis_module
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_module_sync_log (module_id, operation_type, status)
        VALUES (NEW.module_id, 'INSERT', 'PENDING');
    END;
`;

const create_update_trigger = `
    CREATE TRIGGER IF NOT EXISTS trg_kwis_module_update
    AFTER UPDATE ON kwis_module
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_module_sync_log (module_id, operation_type, status)
        VALUES (NEW.module_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_module_delete1
//     AFTER DELETE ON kwis_module_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_module WHERE module_id = OLD.module_id;
//     END;
// `;


module.exports = {
    create_kwis_module_table,
    create_kwis_module_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger
};

