const create_kwis_pdf_config_table = `CREATE TABLE IF NOT EXISTS  kwis_pdf_config (
    id INT AUTO_INCREMENT,
    pdf_config_name VARCHAR(45) NOT NULL UNIQUE,
    logo BLOB NOT NULL,
    only_map TINYINT(1) NOT NULL COMMENT '"0= disable, 1= enable"',
    defect_type_filter TINYINT(1)  NOT NULL COMMENT '"0= disable, 1= enable"',
    defect_status_filter TINYINT(1)  NOT NULL COMMENT '"0= disable, 1= enable"',
    defect_info_filter TINYINT(1)  NOT NULL COMMENT '"0= disable, 1= enable"',
    status TINYINT(1) NOT NULL COMMENT '"0= by default, 1= active pdf setting"',
    isdisabled TINYINT(4) NOT NULL DEFAULT 0 COMMENT '"0= by default, 1= active disable"',
    defect_id_reset TINYINT(1) NULL DEFAULT 0,
    ai_suggestion TINYINT(1) NULL DEFAULT 0,
    location_filter TINYINT(1) NULL DEFAULT 0 COMMENT '"0= disable, 1= enable"',
    sharing_configuration_type VARCHAR(50) NULL,
    mobile_number JSON NULL,
    target_emails JSON NULL,
    PRIMARY KEY (id)
) `

const create_kwis_pdf_config_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_pdf_config_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    pdf_config_id INT NOT NULL COMMENT 'kwis_pdf_config(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_pdf_config_insert
    AFTER INSERT ON kwis_pdf_config
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_pdf_config_sync_log (pdf_config_id, operation_type, status)
        VALUES (NEW.id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_pdf_config_update
    AFTER UPDATE ON kwis_pdf_config
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_pdf_config_sync_log (pdf_config_id, operation_type, status)
        VALUES (NEW.id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_pdf_config_sync_log_delete
//     AFTER DELETE ON kwis_pdf_config_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_pdf_config WHERE id = OLD.pdf_config_id;
//     END;`;

module.exports = {
    create_kwis_pdf_config_table,
    create_kwis_pdf_config_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger,
};
