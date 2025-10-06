-- Employee Termination Table
USE mitsubishi_bis;

CREATE TABLE IF NOT EXISTS employee_terminations (
    termination_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    termination_type ENUM('Resignation', 'Retirement', 'Dismissal', 'Layoff', 'Contract_End', 'Mutual_Agreement') NOT NULL,
    termination_date DATE NOT NULL,
    last_working_day DATE NOT NULL,
    reason TEXT,
    notice_period_days INT,
    severance_pay DECIMAL(12,2),
    unused_leave_payout DECIMAL(12,2),
    final_settlement DECIMAL(12,2),
    return_company_property TEXT,
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    exit_interview_notes TEXT,
    rehire_eligible BOOLEAN DEFAULT TRUE,
    processed_by INT,
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES employees(employee_id)
);

CREATE INDEX idx_termination_employee ON employee_terminations(employee_id);
CREATE INDEX idx_termination_date ON employee_terminations(termination_date);
CREATE INDEX idx_termination_type ON employee_terminations(termination_type);
