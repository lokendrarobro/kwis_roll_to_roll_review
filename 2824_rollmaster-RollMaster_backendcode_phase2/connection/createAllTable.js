// const db= require('./dbConnection.js');
const kwis_defects_log = require('./Tables/kwis_defects_log.js');
const kwis_machine_setup = require('./Tables/kwis_machine_setup.js');
const kwis_module = require('./Tables/kwis_module.js');
const kwis_roll_repair_job = require('./Tables/kwis_roll_repair_job.js');
const kwis_role = require('./Tables/kwis_role.js');
const kwis_rolls_log = require('./Tables/kwis_rolls_log.js');
const kwis_review_job_log = require('./Tables/kwis_review_job_log.js');
const kwis_repair_speed_log = require('./Tables/kwis_repair_speed_log.js')
const kwis_roll_width_log = require('./Tables/kwis_roll_width_log.js');
const kwis_custom_user_tag_info = require('./Tables/kwis_custom_user_tag_info.js');
const kwis_role_modules_permission = require('./Tables/kwis_role_modules_permission.js');
const kwis_quality_code_info = require('./Tables/kwis_quality_code_info.js');
const kwis_pdf_config = require('./Tables/kwis_pdf_config.js');
const kwis_feature_list = require('./Tables/kwis_feature_list.js');
const kwis_jobs_log = require('./Tables/kwis_jobs_log.js');
const kwis_role_feature_permission = require('./Tables/kwis_role_feature_permission.js');
const kwis_inspection_speed_log = require('./Tables/kwis_inspection_speed_log.js');
const kwis_body_log = require('./Tables/kwis_body_log.js')
const kwis_tag_settings = require('./Tables/kwis_tag_settings.js');
const kwis_roll_manufacturing_info = require('./Tables/kwis_roll_manufacturing_info.js');
const kwis_splice_table = require('./Tables/kwis_splice_table.js');
const kwis_slitting_info = require('./Tables/kwis_slitting_info.js');
const kwis_role_permission = require('./Tables/kwis_role_permission.js');
const kwis_inspection_machine_config = require('./Tables/kwis_inspection_machine_config.js');
const kwis_color_thread_log = require('./Tables/kwis_color_thread_log.js');


const create_triggers = process.env.CREATE_TRIGGERS || "true";

async function createAllTables(db) {
    try {

        // Add create tables Queries
        await db.addQuery('kwis_defects_log', kwis_defects_log.create_kwis_defects_log_table);
        await db.addQuery('kwis_defects_log_sync_log', kwis_defects_log.create_kwis_defects_log_sync_log_table);

        await db.addQuery('kwis_machine_setup',kwis_machine_setup.create_kwis_machine_setup_table);
        await db.addQuery('kwis_machine_setup_sync_log', kwis_machine_setup.create_kwis_machine_setup_sync_log_table);

        await db.addQuery('kwis_module',kwis_module.create_kwis_module_table);
        await db.addQuery('kwis_module_sync_log', kwis_module.create_kwis_module_sync_log_table);

        await db.addQuery('kwis_roll_repair_job',kwis_roll_repair_job.create_kwis_roll_repair_job_table);
        await db.addQuery('kwis_roll_repair_job_sync_log',kwis_roll_repair_job.create_kwis_roll_repair_job_sync_log_table);

        await db.addQuery('kwis_role',kwis_role.create_kwis_role_table);
        await db.addQuery('kwis_role_sync_log',kwis_role.create_kwis_role_sync_log_table);

        await db.addQuery('kwis_rolls_log',kwis_rolls_log.create_kwis_rolls_log_table);
        await db.addQuery('kwis_rolls_log_sync_log',kwis_rolls_log.create_kwis_rolls_log_sync_log_table);

        await db.addQuery('kwis_review_job_log',kwis_review_job_log.create_kwis_review_job_log_table);
        await db.addQuery('kwis_review_job_log_sync_log',kwis_review_job_log.create_kwis_review_job_log_sync_log_table);


        await db.addQuery('kwis_repair_speed_log' ,kwis_repair_speed_log.create_kwis_repair_speed_log_table);
        await db.addQuery('kwis_repair_speed_log_sync_log',kwis_repair_speed_log.create_kwis_repair_speed_log_sync_log_table);

        await db.addQuery('kwis_roll_width_log',kwis_roll_width_log.create_kwis_roll_width_log_table);
        await db.addQuery('kwis_roll_width_log_sync_log',kwis_roll_width_log.create_kwis_roll_width_log_sync_log_table);

        await db.addQuery('kwis_custom_user_tag_info',kwis_custom_user_tag_info.create_kwis_custom_user_tag_info_table);
        await db.addQuery('kwis_custom_user_tag_info_sync_log',kwis_custom_user_tag_info.create_kwis_custom_user_tag_info_sync_log_table);

        await db.addQuery('kwis_role_modules_permission',kwis_role_modules_permission.create_kwis_role_modules_permission_table);
        await db.addQuery('kwis_role_modules_permission_sync_log',kwis_role_modules_permission.create_kwis_role_modules_permission_sync_log_table);

        await db.addQuery('kwis_quality_code_info',kwis_quality_code_info.create_kwis_quality_code_info_table);
        await db.addQuery('kwis_quality_code_info_sync_log',kwis_quality_code_info.create_kwis_quality_code_info_sync_log_table);

        await db.addQuery('kwis_pdf_config',kwis_pdf_config.create_kwis_pdf_config_table);
        await db.addQuery('kwis_pdf_config_sync_log',kwis_pdf_config.create_kwis_pdf_config_sync_log_table);

        await db.addQuery('kwis_feature_list',kwis_feature_list.create_kwis_feature_list_table);
        await db.addQuery('kwis_feature_list_sync_log',kwis_feature_list.create_kwis_feature_list_sync_log_table);

        await db.addQuery('kwis_jobs_log',kwis_jobs_log.create_kwis_jobs_log_table);
        await db.addQuery('kwis_jobs_log_sync_log',kwis_jobs_log.create_kwis_jobs_log_sync_log_table);

        await db.addQuery('kwis_role_feature_permission',kwis_role_feature_permission.create_kwis_role_feature_permission_table);
        await db.addQuery('kwis_role_feature_permission_sync_log',kwis_role_feature_permission.create_kwis_role_feature_permission_sync_log_table);

        await db.addQuery('kwis_role_permission',kwis_role_permission.create_kwis_role_permission_table);
        await db.addQuery('kwis_role_permission_sync_log',kwis_role_permission.create_kwis_role_permission_sync_log_table);
        
        await db.addQuery('kwis_inspection_speed_log',kwis_inspection_speed_log.create_kwis_inspection_speed_log_table);
        await db.addQuery('kwis_inspection_speed_log_sync_log',kwis_inspection_speed_log.create_kwis_inspection_speed_log_sync_log_table);

        await db.addQuery('kwis_body_log',kwis_body_log.create_kwis_body_log_table);
        await db.addQuery('kwis_body_log_sync_log',kwis_body_log.create_kwis_body_log_sync_log_table);

        await db.addQuery('kwis_tag_settings',kwis_tag_settings.create_kwis_tag_settings_table);
        await db.addQuery('kwis_tag_settings_sync_log',kwis_tag_settings.create_kwis_tag_settings_sync_log_table);

        await db.addQuery('kwis_roll_manufacturing_info',kwis_roll_manufacturing_info.create_kwis_roll_manufacturing_info_table);
        await db.addQuery('kwis_roll_manufacturing_info_sync_log',kwis_roll_manufacturing_info.create_kwis_roll_manufacturing_info_sync_log_table);

        await db.addQuery('kwis_splice_table',kwis_splice_table.create_kwis_splice_table_table);
        await db.addQuery('kwis_splice_table_sync_log',kwis_splice_table.create_kwis_splice_table_sync_log_table);

        await db.addQuery('kwis_slitting_info',kwis_slitting_info.create_kwis_slitting_info_table);
        await db.addQuery('kwis_slitting_info_sync_log',kwis_slitting_info.create_kwis_slitting_info_sync_log_table);

        await db.addQuery('kwis_inspection_machine_config',kwis_inspection_machine_config.create_kwis_inspection_machine_config_table);
        await db.addQuery('kwis_inspection_machine_config_sync_log',kwis_inspection_machine_config.create_kwis_inspection_machine_config_sync_log_table);

        await db.addQuery('kwis_color_thread_log', kwis_color_thread_log.create_kwis_color_thread_log_table);
        await db.addQuery('kwis_color_thread_log_sync_log', kwis_color_thread_log.create_kwis_color_thread_log_sync_log_table);

        // Execute table creation queries with execute method
        console.log("kwis_defects_log", await db.runQuery('kwis_defects_log'));
        console.log("kwis_defects_log_sync_log", await db.runQuery('kwis_defects_log_sync_log'));
        console.log("kwis_machine_setup", await db.runQuery('kwis_machine_setup'));
        console.log("kwis_machine_setup_sync_log", await db.runQuery('kwis_machine_setup_sync_log'));
        console.log("kwis_module", await db.runQuery('kwis_module'));
        console.log("kwis_module_sync_log", await db.runQuery('kwis_module_sync_log'));
        console.log("kwis_roll_repair_job", await db.runQuery('kwis_roll_repair_job'));
        console.log("kwis_roll_repair_job_sync_log", await db.runQuery('kwis_roll_repair_job_sync_log'));
        console.log("kwis_role", await db.runQuery('kwis_role'));
        console.log("kwis_role_sync_log", await db.runQuery('kwis_role_sync_log'));
        console.log("kwis_rolls_log", await db.runQuery('kwis_rolls_log'));
        console.log("kwis_rolls_log_sync_log", await db.runQuery('kwis_rolls_log_sync_log'));
        console.log("kwis_review_job_log", await db.runQuery('kwis_review_job_log'));
        console.log("kwis_review_job_log_sync_log", await db.runQuery('kwis_review_job_log_sync_log'));
        console.log("kwis_repair_speed_log", await db.runQuery('kwis_repair_speed_log'));
        console.log("kwis_repair_speed_log_sync_log", await db.runQuery('kwis_repair_speed_log_sync_log'));
        console.log("kwis_roll_width_log", await db.runQuery('kwis_roll_width_log'));
        console.log("kwis_roll_width_log_sync_log", await db.runQuery('kwis_roll_width_log_sync_log'));
        console.log("kwis_custom_user_tag_info", await db.runQuery('kwis_custom_user_tag_info'));
        console.log("kwis_custom_user_tag_info_sync_log", await db.runQuery('kwis_custom_user_tag_info_sync_log'));
        console.log("kwis_role_modules_permission", await db.runQuery('kwis_role_modules_permission'));
        console.log("kwis_role_modules_permission_sync_log", await db.runQuery('kwis_role_modules_permission_sync_log'));
        console.log("kwis_quality_code_info", await db.runQuery('kwis_quality_code_info'));
        console.log("kwis_quality_code_info_sync_log", await db.runQuery('kwis_quality_code_info_sync_log'));
        console.log("kwis_pdf_config", await db.runQuery('kwis_pdf_config'));
        console.log("kwis_pdf_config_sync_log", await db.runQuery('kwis_pdf_config_sync_log'));
        console.log("kwis_feature_list", await db.runQuery('kwis_feature_list'));
        console.log("kwis_feature_list_sync_log", await db.runQuery('kwis_feature_list_sync_log'));
        console.log("kwis_jobs_log", await db.runQuery('kwis_jobs_log'));
        console.log("kwis_jobs_log_sync_log", await db.runQuery('kwis_jobs_log_sync_log'));
        console.log("kwis_role_feature_permission", await db.runQuery('kwis_role_feature_permission'));
        console.log("kwis_role_feature_permission_sync_log", await db.runQuery('kwis_role_feature_permission_sync_log'));
        console.log("kwis_role_permission", await db.runQuery('kwis_role_permission'));
        console.log("kwis_role_permission_sync_log", await db.runQuery('kwis_role_permission_sync_log'));
        console.log("kwis_inspection_speed_log", await db.runQuery('kwis_inspection_speed_log'));
        console.log("kwis_inspection_speed_log_sync_log", await db.runQuery('kwis_inspection_speed_log_sync_log'));
        console.log("kwis_body_log", await db.runQuery('kwis_body_log'));
        console.log("kwis_body_log_sync_log", await db.runQuery('kwis_body_log_sync_log'));
        console.log("kwis_tag_settings", await db.runQuery('kwis_tag_settings'));
        console.log("kwis_tag_settings_sync_log", await db.runQuery('kwis_tag_settings_sync_log'));
        console.log("kwis_roll_manufacturing_info", await db.runQuery('kwis_roll_manufacturing_info'));
        console.log("kwis_roll_manufacturing_info_sync_log", await db.runQuery('kwis_roll_manufacturing_info_sync_log'));
        console.log("kwis_splice_table", await db.runQuery('kwis_splice_table'));
        console.log("kwis_splice_table_sync_log", await db.runQuery('kwis_splice_table_sync_log'));
        console.log("kwis_slitting_info", await db.runQuery('kwis_slitting_info'));
        console.log("kwis_slitting_info_sync_log", await db.runQuery('kwis_slitting_info_sync_log'));
        console.log("kwis_inspection_machine_config", await db.runQuery('kwis_inspection_machine_config'));
        console.log("kwis_inspection_machine_config_sync_log", await db.runQuery('kwis_inspection_machine_config_sync_log'));
        console.log("kwis_color_thread_log", await db.runQuery('kwis_color_thread_log'));
        console.log("kwis_color_thread_log_sync_log", await db.runQuery('kwis_color_thread_log_sync_log'));
       
        // console.log(create_triggers)
        if(create_triggers === "true")
        {
            // Add trigger queries
            await db.addQuery('trg_kwis_defects_log_insert',kwis_defects_log.create_insert_trigger);
            await db.addQuery('trg_kwis_defects_log_update',kwis_defects_log.create_update_trigger);
            await db.addQuery('trg_kwis_defects_log_delete',kwis_defects_log.create_delete_trigger);

            await db.addQuery('trg_kwis_machine_setup_insert',kwis_machine_setup.create_insert_trigger);
            await db.addQuery('trg_kwis_machine_setup_update',kwis_machine_setup.create_update_trigger);

            await db.addQuery('trg_kwis_module_insert',kwis_module.create_insert_trigger);
            await db.addQuery('trg_kwis_module_update',kwis_module.create_update_trigger);

            await db.addQuery('trg_kwis_roll_repair_job_insert',kwis_roll_repair_job.create_insert_trigger);
            await db.addQuery('trg_kwis_roll_repair_job_update',kwis_roll_repair_job.create_update_trigger);
            await db.addQuery('trg_kwis_roll_repair_job_delete',kwis_roll_repair_job.create_delete_trigger);

            await db.addQuery('trg_kwis_role_insert',kwis_role.create_insert_trigger);
            await db.addQuery('trg_kwis_role_update',kwis_role.create_update_trigger);

            await db.addQuery('trg_kwis_rolls_log_insert',kwis_rolls_log.create_insert_trigger);
            await db.addQuery('trg_kwis_rolls_log_update',kwis_rolls_log.create_update_trigger);
            await db.addQuery('trg_kwis_rolls_log_delete',kwis_rolls_log.create_delete_trigger);

            await db.addQuery('trg_kwis_review_job_log_insert', kwis_review_job_log.create_insert_trigger);
            await db.addQuery('trg_kwis_review_job_log_update', kwis_review_job_log.create_update_trigger);
            await db.addQuery('trg_kwis_review_job_log_delete', kwis_review_job_log.create_delete_trigger);

            await db.addQuery('trg_kwis_repair_speed_log_insert',kwis_repair_speed_log.create_insert_trigger);
            await db.addQuery('trg_kwis_repair_speed_log_update',kwis_repair_speed_log.create_update_trigger);
            await db.addQuery('trg_kwis_repair_speed_log_delete',kwis_repair_speed_log.create_delete_trigger);

            await db.addQuery('trg_kwis_roll_width_log_insert',kwis_roll_width_log.create_insert_trigger);
            await db.addQuery('trg_kwis_roll_width_log_update',kwis_roll_width_log.create_update_trigger);
            await db.addQuery('trg_kwis_roll_width_log_delete',kwis_roll_width_log.create_delete_trigger);

            await db.addQuery('trg_kwis_custom_user_tag_info_insert',kwis_custom_user_tag_info.
                create_insert_trigger);
            await db.addQuery('trg_kwis_custom_user_tag_info_update',kwis_custom_user_tag_info.
                create_update_trigger);

            await db.addQuery('trg_kwis_role_modules_permission_insert',kwis_role_modules_permission.
                create_insert_trigger);
            await db.addQuery('trg_kwis_role_modules_permission_update',kwis_role_modules_permission.
                create_update_trigger);

            await db.addQuery('trg_kwis_quality_code_info_insert',kwis_quality_code_info.
                create_insert_trigger);
            await db.addQuery('trg_kwis_quality_code_info_update',kwis_quality_code_info.
                create_update_trigger);

            await db.addQuery('trg_kwis_pdf_config_insert',kwis_pdf_config.
                    create_insert_trigger);
            await db.addQuery('trg_kwis_pdf_config_update',kwis_pdf_config.
                    create_update_trigger);
                    
            await db.addQuery('trg_kwis_feature_list_insert',kwis_feature_list.
                        create_insert_trigger);
            await db.addQuery('trg_kwis_feature_list_update',kwis_feature_list.
                        create_update_trigger);
                
            await db.addQuery('trg_kwis_jobs_log_insert',kwis_jobs_log.create_insert_trigger);
            await db.addQuery('trg_kwis_jobs_log_update',kwis_jobs_log.create_update_trigger);
            await db.addQuery('trg_kwis_jobs_log_delete',kwis_jobs_log.create_delete_trigger);

            await db.addQuery('trg_kwis_role_feature_permission_insert',kwis_role_feature_permission.create_insert_trigger);
            await db.addQuery('trg_kwis_role_feature_permission_update',kwis_role_feature_permission.create_update_trigger);

            await db.addQuery('trg_kwis_role_permission_insert',kwis_role_permission.create_insert_trigger);
            await db.addQuery('trg_kwis_role_permission_update',kwis_role_permission.create_update_trigger);

            await db.addQuery('trg_kwis_inspection_speed_log_insert',kwis_inspection_speed_log.create_insert_trigger);
            await db.addQuery('trg_kwis_inspection_speed_log_update',kwis_inspection_speed_log.create_update_trigger);
            await db.addQuery('trg_kwis_inspection_speed_log_delete',kwis_inspection_speed_log.create_delete_trigger);

            await db.addQuery('trg_kwis_body_log_insert',kwis_body_log.create_insert_trigger);
            await db.addQuery('trg_kwis_body_log_update',kwis_body_log.create_update_trigger);
            await db.addQuery('trg_kwis_body_log_delete',kwis_body_log.create_delete_trigger);

            await db.addQuery('trg_kwis_tag_settings_insert',kwis_tag_settings.create_insert_trigger);
            await db.addQuery('trg_kwis_tag_settings_update',kwis_tag_settings.create_update_trigger);

            await db.addQuery('trg_kwis_roll_manufacturing_info_insert',kwis_roll_manufacturing_info.create_insert_trigger);
            await db.addQuery('trg_kwis_roll_manufacturing_info_update',kwis_roll_manufacturing_info.create_update_trigger);
            await db.addQuery('trg_kwis_roll_manufacturing_info_delete',kwis_roll_manufacturing_info.create_delete_trigger);

            await db.addQuery('trg_kwis_splice_table_insert',kwis_splice_table.create_insert_trigger);
            await db.addQuery('trg_kwis_splice_table_update',kwis_splice_table.create_update_trigger);
            await db.addQuery('trg_kwis_splice_table_delete',kwis_splice_table.create_delete_trigger);

            await db.addQuery('trg_kwis_slitting_info_insert',kwis_slitting_info.create_insert_trigger);
            await db.addQuery('trg_kwis_slitting_info_update',kwis_slitting_info.create_update_trigger);
            await db.addQuery('trg_kwis_slitting_info_delete',kwis_slitting_info.create_delete_trigger);

            await db.addQuery('trg_kwis_inspection_machine_config_insert',kwis_inspection_machine_config.create_kwis_inspection_machine_config_insert_trigger);
            await db.addQuery('trg_kwis_inspection_machine_config_update',kwis_inspection_machine_config.create_kwis_inspection_machine_config_update_trigger);
            
            await db.addQuery('trg_kwis_color_thread_log_insert',kwis_color_thread_log.create_insert_trigger);
            await db.addQuery('trg_kwis_color_thread_log_update',kwis_color_thread_log.create_update_trigger);
            await db.addQuery('trg_kwis_color_thread_log_delete',kwis_color_thread_log.create_delete_trigger);

            // Execute trigger creation query with query method console.log(;
            console.log('trg_kwis_defects_log_insert:', await db.runQuery('trg_kwis_defects_log_insert'));
            console.log('trg_kwis_defects_log_update:', await db.runQuery('trg_kwis_defects_log_update'));
            console.log('trg_kwis_defects_log_delete:', await db.runQuery('trg_kwis_defects_log_delete'));

            console.log('trg_kwis_machine_setup_insert:', await db.runQuery('trg_kwis_machine_setup_insert'));
            console.log('trg_kwis_machine_setup_update:', await db.runQuery('trg_kwis_machine_setup_update'));

            console.log('trg_kwis_module_insert:', await db.runQuery('trg_kwis_module_insert'));
            console.log('trg_kwis_module_update:', await db.runQuery('trg_kwis_module_update'));

            console.log('trg_kwis_roll_repair_job_insert:', await db.runQuery('trg_kwis_roll_repair_job_insert'));
            console.log('trg_kwis_roll_repair_job_update:', await db.runQuery('trg_kwis_roll_repair_job_update'));
            console.log('trg_kwis_roll_repair_job_delete:', await db.runQuery('trg_kwis_roll_repair_job_delete'));

            console.log('trg_kwis_role_insert:', await db.runQuery('trg_kwis_role_insert'));
            console.log('trg_kwis_role_update:', await db.runQuery('trg_kwis_role_update'));

            console.log('trg_kwis_rolls_log_insert:', await db.runQuery('trg_kwis_rolls_log_insert'));
            console.log('trg_kwis_rolls_log_update:', await db.runQuery('trg_kwis_rolls_log_update'));
            console.log('trg_kwis_repair_speed_log_insert:', await db.runQuery('trg_kwis_repair_speed_log_insert'));
            console.log('trg_kwis_repair_speed_log_update:', await db.runQuery('trg_kwis_repair_speed_log_update'));
            console.log('trg_kwis_repair_speed_log_delete:', await db.runQuery('trg_kwis_repair_speed_log_delete'));

            console.log('trg_kwis_roll_width_log_insert:', await db.runQuery('trg_kwis_roll_width_log_insert'));
            console.log('trg_kwis_roll_width_log_update:', await db.runQuery('trg_kwis_roll_width_log_update'));
            console.log('trg_kwis_roll_width_log_delete:', await db.runQuery('trg_kwis_roll_width_log_delete'));

            console.log('trg_kwis_custom_user_tag_info_insert:', await db.runQuery('trg_kwis_custom_user_tag_info_insert'));
            console.log('trg_kwis_custom_user_tag_info_update:', await db.runQuery('trg_kwis_custom_user_tag_info_update'));

            console.log('trg_kwis_role_modules_permission_insert:', await db.runQuery('trg_kwis_role_modules_permission_insert'));
            console.log('trg_kwis_role_modules_permission_update:', await db.runQuery('trg_kwis_role_modules_permission_update'));

            console.log('trg_kwis_quality_code_info_insert:', await db.runQuery('trg_kwis_quality_code_info_insert'));
            console.log('trg_kwis_quality_code_info_update:', await db.runQuery('trg_kwis_quality_code_info_update'));

            console.log('trg_kwis_pdf_config_insert:', await db.runQuery('trg_kwis_pdf_config_insert'));
            console.log('trg_kwis_pdf_config_update:', await db.runQuery('trg_kwis_pdf_config_update'));

            console.log('trg_kwis_feature_list_insert:', await db.runQuery('trg_kwis_feature_list_insert'));
            console.log('trg_kwis_feature_list_update:', await db.runQuery('trg_kwis_feature_list_update'));

            console.log('trg_kwis_jobs_log_insert:', await db.runQuery('trg_kwis_jobs_log_insert'));
            console.log('trg_kwis_jobs_log_update:', await db.runQuery('trg_kwis_jobs_log_update'));
            console.log('trg_kwis_jobs_log_delete:', await db.runQuery('trg_kwis_jobs_log_delete'));

            console.log('trg_kwis_review_job_log_insert:', await db.runQuery('trg_kwis_review_job_log_insert'));
            console.log('trg_kwis_review_job_log_update:', await db.runQuery('trg_kwis_review_job_log_update'));
            console.log('trg_kwis_review_job_log_delete:', await db.runQuery('trg_kwis_review_job_log_delete'));

            console.log('trg_kwis_role_feature_permission_insert:', await db.runQuery('trg_kwis_role_feature_permission_insert'));
            console.log('trg_kwis_role_feature_permission_update:', await db.runQuery('trg_kwis_role_feature_permission_update'));

            console.log('trg_kwis_role_permission_insert:', await db.runQuery('trg_kwis_role_permission_insert'));
            console.log('trg_kwis_role_permission_update:', await db.runQuery('trg_kwis_role_permission_update'));

            console.log('trg_kwis_inspection_speed_log_insert:', await db.runQuery('trg_kwis_inspection_speed_log_insert'));
            console.log('trg_kwis_inspection_speed_log_update:', await db.runQuery('trg_kwis_inspection_speed_log_update'));
            console.log('trg_kwis_inspection_speed_log_delete:', await db.runQuery('trg_kwis_inspection_speed_log_delete'));

            console.log('trg_kwis_body_log_insert:', await db.runQuery('trg_kwis_body_log_insert'));
            console.log('trg_kwis_body_log_update:', await db.runQuery('trg_kwis_body_log_update'));
            console.log('trg_kwis_body_log_delete:', await db.runQuery('trg_kwis_body_log_delete'));

            console.log('trg_kwis_tag_settings_insert:', await db.runQuery('trg_kwis_tag_settings_insert'));
            console.log('trg_kwis_tag_settings_update:', await db.runQuery('trg_kwis_tag_settings_update'));

            console.log('trg_kwis_roll_manufacturing_info_insert:', await db.runQuery('trg_kwis_roll_manufacturing_info_insert'));
            console.log('trg_kwis_roll_manufacturing_info_update:', await db.runQuery('trg_kwis_roll_manufacturing_info_update'));
            console.log('trg_kwis_roll_manufacturing_info_delete:', await db.runQuery('trg_kwis_roll_manufacturing_info_delete'));

            console.log('trg_kwis_splice_table_insert:', await db.runQuery('trg_kwis_splice_table_insert'));
            console.log('trg_kwis_splice_table_update:', await db.runQuery('trg_kwis_splice_table_update'));
            console.log('trg_kwis_splice_table_delete:', await db.runQuery('trg_kwis_splice_table_delete'));

            console.log('trg_kwis_slitting_info_insert:', await db.runQuery('trg_kwis_slitting_info_insert'));
            console.log('trg_kwis_slitting_info_update:', await db.runQuery('trg_kwis_slitting_info_update'));
            console.log('trg_kwis_slitting_info_delete:', await db.runQuery('trg_kwis_slitting_info_delete'));

            console.log('trg_kwis_inspection_machine_config_insert:', await db.runQuery('trg_kwis_inspection_machine_config_insert'));
            console.log('trg_kwis_inspection_machine_config_update:', await db.runQuery('trg_kwis_inspection_machine_config_update'));

            console.log('trg_kwis_color_thread_log_insert:', await db.runQuery('trg_kwis_color_thread_log_insert'));
            console.log('trg_kwis_color_thread_log_update:', await db.runQuery('trg_kwis_color_thread_log_update'));
            console.log('trg_kwis_color_thread_log_delete:', await db.runQuery('trg_kwis_color_thread_log_delete'));
        }
        
        
    } catch (error) {
        console.error("Error creating tables and trigger:", error.message);
        throw error; // Rethrow the error to handle it further up the chain if needed
    }
}


module.exports = {
    createAllTables
}
