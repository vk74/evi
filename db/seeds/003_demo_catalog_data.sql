-- Version: 1.0
-- Description: Demo catalog data (sections and services)
-- Backend file: demo_catalog

-- Insert catalog sections
INSERT INTO app.catalog_sections (id, name, owner, description, status, is_public, "order", icon_name, color, created_by) VALUES
-- Catalog sections
('880e8400-e29b-41d4-a716-446655440001', 'IT Services', '550e8400-e29b-41d4-a716-446655440001', 'Information Technology Services', 'active', true, 1, 'Monitor', '#F8F0F0', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Business Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Business Process Solutions', 'active', true, 2, 'Briefcase', '#F5F5F0', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Support Services', '550e8400-e29b-41d4-a716-446655440001', 'Technical Support and Maintenance', 'active', true, 3, 'Headset', '#E8F5F0', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440004', 'Security Services', '550e8400-e29b-41d4-a716-446655440001', 'Cybersecurity and Compliance', 'active', true, 4, 'Shield', '#E8E8F5', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440005', 'Cloud Solutions', '550e8400-e29b-41d4-a716-446655440001', 'Cloud Infrastructure and Services', 'active', true, 5, 'Cloud', '#F8F8F8', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_public = EXCLUDED.is_public,
    "order" = EXCLUDED."order",
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color;

-- Note: Sub-sections removed for simplicity

-- Insert services
INSERT INTO app.services (id, name, priority, status, description_short, description_long, purpose, is_public, icon_name, created_by) VALUES
-- IT Services
('990e8400-e29b-41d4-a716-446655440001', 'Web Application Development', 'high', 'in_production', 'Custom web applications', 'Full-stack web application development using modern technologies', 'Create scalable web solutions for business needs', true, 'Globe', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'medium', 'in_production', 'iOS and Android apps', 'Native and cross-platform mobile application development', 'Extend business reach through mobile platforms', true, 'Smartphone', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440003', 'Database Design', 'high', 'in_production', 'Database architecture', 'Design and optimization of database systems', 'Ensure data integrity and performance', true, 'Database', '550e8400-e29b-41d4-a716-446655440001'),
-- Business Solutions
('990e8400-e29b-41d4-a716-446655440004', 'Process Automation', 'medium', 'in_production', 'Workflow automation', 'Automate business processes to improve efficiency', 'Reduce manual work and increase productivity', true, 'Robot', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440005', 'Data Analytics', 'high', 'in_production', 'Business intelligence', 'Data analysis and reporting solutions', 'Make informed business decisions', true, 'Chart', '550e8400-e29b-41d4-a716-446655440001'),
-- Support Services
('990e8400-e29b-41d4-a716-446655440006', '24/7 Technical Support', 'critical', 'in_production', 'Round-the-clock support', '24/7 technical support for critical systems', 'Ensure continuous system availability', true, 'Support', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440007', 'System Maintenance', 'medium', 'in_production', 'Regular maintenance', 'Preventive maintenance and system updates', 'Keep systems running optimally', true, 'Wrench', '550e8400-e29b-41d4-a716-446655440001'),
-- Security Services
('990e8400-e29b-41d4-a716-446655440008', 'Security Audit', 'high', 'in_production', 'Security assessment', 'Comprehensive security audits and assessments', 'Identify and mitigate security risks', true, 'Shield', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440009', 'Compliance Management', 'high', 'in_production', 'Regulatory compliance', 'Ensure compliance with industry regulations', 'Meet legal and regulatory requirements', true, 'CheckCircle', '550e8400-e29b-41d4-a716-446655440001'),
-- Cloud Solutions
('990e8400-e29b-41d4-a716-446655440010', 'Cloud Migration', 'high', 'in_production', 'Cloud infrastructure', 'Migrate applications to cloud platforms', 'Improve scalability and reduce costs', true, 'Cloud', '550e8400-e29b-41d4-a716-446655440001'),
('990e8400-e29b-41d4-a716-446655440011', 'DevOps Services', 'medium', 'in_production', 'DevOps implementation', 'Implement DevOps practices and tools', 'Accelerate software delivery', true, 'GitBranch', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    description_short = EXCLUDED.description_short,
    description_long = EXCLUDED.description_long,
    purpose = EXCLUDED.purpose,
    is_public = EXCLUDED.is_public,
    icon_name = EXCLUDED.icon_name;

-- Link services to sections
INSERT INTO app.section_services (section_id, service_id, service_order) VALUES
-- IT Services section
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 1),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 2),
('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440003', 3),
-- Business Solutions section
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440004', 1),
('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440005', 2),
-- Support Services section
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440006', 1),
('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440007', 2),
-- Security Services section
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440008', 1),
('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440009', 2),
-- Cloud Solutions section
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440010', 1),
('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440011', 2)
ON CONFLICT (section_id, service_id) DO UPDATE SET
    service_order = EXCLUDED.service_order;
