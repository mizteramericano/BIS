const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedEmployees() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('กำลังเพิ่มข้อมูลพนักงาน 100 คน...');

        // ลบข้อมูลเก่าก่อน (ถ้ามี)
        await connection.query('DELETE FROM employees WHERE employee_code LIKE "EMP%"');
        console.log('ลบข้อมูลเก่าเรียบร้อย');

        const employees = [
            ['EMP001', 'นาย', 'สมชาย', 'ใจดี', 'Somchai', 'Jaidee', '1234567890123', '1985-03-15', 'Male', 'somchai.j@mitsubishi.co.th', '081-234-5601', 1, 1, '2015-01-15', 45000.00, 'Active'],
            ['EMP002', 'นาง', 'สมหญิง', 'รักสงบ', 'Somying', 'Raksangob', '1234567890124', '1988-07-22', 'Female', 'somying.r@mitsubishi.co.th', '081-234-5602', 1, 2, '2016-03-20', 38000.00, 'Active'],
            ['EMP003', 'นาย', 'วิชัย', 'มั่นคง', 'Wichai', 'Mankhong', '1234567890125', '1990-11-08', 'Male', 'wichai.m@mitsubishi.co.th', '081-234-5603', 2, 3, '2017-05-10', 42000.00, 'Active'],
            ['EMP004', 'นางสาว', 'ปราณี', 'สุขใจ', 'Pranee', 'Sukjai', '1234567890126', '1992-01-30', 'Female', 'pranee.s@mitsubishi.co.th', '081-234-5604', 2, 4, '2018-02-14', 35000.00, 'Active'],
            ['EMP005', 'นาย', 'ธนา', 'เจริญสุข', 'Tana', 'Charoensuk', '1234567890127', '1987-06-12', 'Male', 'tana.c@mitsubishi.co.th', '081-234-5605', 3, 1, '2014-08-01', 48000.00, 'Active'],
            ['EMP006', 'นาย', 'สุรชัย', 'วงศ์ใหญ่', 'Surachai', 'Wongyai', '1234567890128', '1989-09-25', 'Male', 'surachai.w@mitsubishi.co.th', '081-234-5606', 3, 2, '2016-11-03', 40000.00, 'Active'],
            ['EMP007', 'นางสาว', 'จันทร์จิรา', 'แสงทอง', 'Janjira', 'Sangthong', '1234567890129', '1991-04-18', 'Female', 'janjira.s@mitsubishi.co.th', '081-234-5607', 4, 3, '2017-09-15', 36000.00, 'Active'],
            ['EMP008', 'นาย', 'ประยุทธ', 'สมบูรณ์', 'Prayuth', 'Somboon', '1234567890130', '1986-12-05', 'Male', 'prayuth.s@mitsubishi.co.th', '081-234-5608', 4, 4, '2015-07-20', 44000.00, 'Active'],
            ['EMP009', 'นาง', 'วิไล', 'ศรีสุข', 'Wilai', 'Srisuk', '1234567890131', '1984-08-14', 'Female', 'wilai.s@mitsubishi.co.th', '081-234-5609', 5, 1, '2013-04-10', 50000.00, 'Active'],
            ['EMP010', 'นาย', 'อนุชา', 'พลอยงาม', 'Anucha', 'Ployngam', '1234567890132', '1993-02-28', 'Male', 'anucha.p@mitsubishi.co.th', '081-234-5610', 5, 2, '2018-06-25', 37000.00, 'Active'],
            ['EMP011', 'นางสาว', 'กนกวรรณ', 'ทองดี', 'Kanokwan', 'Thongdee', '1234567890133', '1990-10-11', 'Female', 'kanokwan.t@mitsubishi.co.th', '081-234-5611', 1, 3, '2017-01-08', 39000.00, 'Active'],
            ['EMP012', 'นาย', 'ชัยวัฒน์', 'มีสุข', 'Chaiwat', 'Meesuk', '1234567890134', '1988-05-19', 'Male', 'chaiwat.m@mitsubishi.co.th', '081-234-5612', 1, 4, '2016-10-12', 41000.00, 'Active'],
            ['EMP013', 'นาย', 'บุญชู', 'รักดี', 'Boonchou', 'Rakdee', '1234567890135', '1985-07-03', 'Male', 'boonchou.r@mitsubishi.co.th', '081-234-5613', 2, 5, '2015-03-17', 33000.00, 'Active'],
            ['EMP014', 'นางสาว', 'สุภาพร', 'เพ็ญแสง', 'Supaporn', 'Pensang', '1234567890136', '1994-11-27', 'Female', 'supaporn.p@mitsubishi.co.th', '081-234-5614', 2, 6, '2019-08-05', 28000.00, 'Active'],
            ['EMP015', 'นาย', 'วีระ', 'สุขสันต์', 'Veera', 'Suksan', '1234567890137', '1987-09-16', 'Male', 'veera.s@mitsubishi.co.th', '081-234-5615', 3, 5, '2016-05-22', 34000.00, 'Active'],
            ['EMP016', 'นาง', 'มาลี', 'ใจงาม', 'Malee', 'Jaingam', '1234567890138', '1983-03-09', 'Female', 'malee.j@mitsubishi.co.th', '081-234-5616', 3, 1, '2012-12-01', 52000.00, 'Active'],
            ['EMP017', 'นาย', 'สมศักดิ์', 'ทรงเกียรติ', 'Somsak', 'Songkiat', '1234567890139', '1991-06-21', 'Male', 'somsak.s@mitsubishi.co.th', '081-234-5617', 4, 2, '2017-11-14', 38000.00, 'Active'],
            ['EMP018', 'นางสาว', 'ชนิดา', 'แก้วใส', 'Chanida', 'Kaewsai', '1234567890140', '1995-01-13', 'Female', 'chanida.k@mitsubishi.co.th', '081-234-5618', 4, 3, '2020-02-10', 32000.00, 'Active'],
            ['EMP019', 'นาย', 'ประเสริฐ', 'บุญมี', 'Prasert', 'Boonmee', '1234567890141', '1986-08-07', 'Male', 'prasert.b@mitsubishi.co.th', '081-234-5619', 5, 4, '2015-09-28', 43000.00, 'Active'],
            ['EMP020', 'นาย', 'นิรันดร์', 'สุขเกษม', 'Niran', 'Sukkasem', '1234567890142', '1989-12-24', 'Male', 'niran.s@mitsubishi.co.th', '081-234-5620', 5, 5, '2017-07-03', 35000.00, 'Active'],
            ['EMP021', 'นางสาว', 'รัชนี', 'ดอกบัว', 'Ratchanee', 'Dokbua', '1234567890143', '1992-04-15', 'Female', 'ratchanee.d@mitsubishi.co.th', '081-234-5621', 1, 2, '2018-03-19', 37000.00, 'Active'],
            ['EMP022', 'นาย', 'พิชัย', 'มั่งคั่ง', 'Pichai', 'Mangkhang', '1234567890144', '1984-10-30', 'Male', 'pichai.m@mitsubishi.co.th', '081-234-5622', 1, 3, '2014-06-11', 45000.00, 'Active'],
            ['EMP023', 'นาง', 'สุดา', 'เรืองศรี', 'Suda', 'Rueangsi', '1234567890145', '1987-02-08', 'Female', 'suda.r@mitsubishi.co.th', '081-234-5623', 2, 4, '2016-01-25', 40000.00, 'Active'],
            ['EMP024', 'นาย', 'อดุลย์', 'ชัยชนะ', 'Adun', 'Chaichana', '1234567890146', '1990-07-17', 'Male', 'adun.c@mitsubishi.co.th', '081-234-5624', 2, 5, '2017-10-08', 34000.00, 'Active'],
            ['EMP025', 'นางสาว', 'พรทิพย์', 'สุวรรณ', 'Porntip', 'Suwan', '1234567890147', '1993-11-23', 'Female', 'porntip.s@mitsubishi.co.th', '081-234-5625', 3, 6, '2019-04-16', 29000.00, 'Active'],
            ['EMP026', 'นาย', 'สมบัติ', 'ร่ำรวย', 'Sombat', 'Ramruay', '1234567890148', '1985-05-12', 'Male', 'sombat.r@mitsubishi.co.th', '081-234-5626', 3, 1, '2015-02-03', 48000.00, 'Active'],
            ['EMP027', 'นาย', 'กิตติ', 'ประเสริฐ', 'Kitti', 'Prasert', '1234567890149', '1988-09-29', 'Male', 'kitti.p@mitsubishi.co.th', '081-234-5627', 4, 2, '2016-12-20', 39000.00, 'Active'],
            ['EMP028', 'นางสาว', 'นิภา', 'เลิศล้ำ', 'Nipa', 'Lertlam', '1234567890150', '1994-03-06', 'Female', 'nipa.l@mitsubishi.co.th', '081-234-5628', 4, 3, '2019-09-11', 33000.00, 'Active'],
            ['EMP029', 'นาย', 'ชาญชัย', 'วิทยา', 'Chanchai', 'Wittaya', '1234567890151', '1986-01-14', 'Male', 'chanchai.w@mitsubishi.co.th', '081-234-5629', 5, 4, '2015-11-07', 42000.00, 'Active'],
            ['EMP030', 'นาง', 'สุนีย์', 'อรุณ', 'Sunee', 'Arun', '1234567890152', '1982-06-20', 'Female', 'sunee.a@mitsubishi.co.th', '081-234-5630', 5, 1, '2011-08-15', 54000.00, 'Active'],
            ['EMP031', 'นาย', 'ธีรพงษ์', 'กล้าหาญ', 'Teerapong', 'Klahan', '1234567890153', '1991-12-02', 'Male', 'teerapong.k@mitsubishi.co.th', '081-234-5631', 1, 5, '2018-01-22', 35000.00, 'Active'],
            ['EMP032', 'นางสาว', 'อรพรรณ', 'งามสม', 'Orapan', 'Ngamsom', '1234567890154', '1995-08-18', 'Female', 'orapan.n@mitsubishi.co.th', '081-234-5632', 1, 6, '2020-05-04', 27000.00, 'Active'],
            ['EMP033', 'นาย', 'ยุทธนา', 'เข้มแข็ง', 'Yuttana', 'Khemkhaeng', '1234567890155', '1987-04-25', 'Male', 'yuttana.k@mitsubishi.co.th', '081-234-5633', 2, 2, '2016-07-18', 38000.00, 'Active'],
            ['EMP034', 'นาย', 'สุพจน์', 'ดีเลิศ', 'Supot', 'Deelert', '1234567890156', '1989-10-09', 'Male', 'supot.d@mitsubishi.co.th', '081-234-5634', 2, 3, '2017-03-27', 36000.00, 'Active'],
            ['EMP035', 'นางสาว', 'วาสนา', 'สว่างไสว', 'Wasana', 'Sawangsai', '1234567890157', '1992-02-16', 'Female', 'wasana.s@mitsubishi.co.th', '081-234-5635', 3, 4, '2018-08-13', 34000.00, 'Active'],
            ['EMP036', 'นาย', 'ชัยยา', 'มีชัย', 'Chaiya', 'Meechai', '1234567890158', '1984-07-31', 'Male', 'chaiya.m@mitsubishi.co.th', '081-234-5636', 3, 5, '2014-11-24', 44000.00, 'Active'],
            ['EMP037', 'นาง', 'จิราพร', 'ปานแก้ว', 'Jiraporn', 'Pankaew', '1234567890159', '1986-11-05', 'Female', 'jiraporn.p@mitsubishi.co.th', '081-234-5637', 4, 1, '2015-05-19', 49000.00, 'Active'],
            ['EMP038', 'นาย', 'ณัฐพงษ์', 'พลังใหม่', 'Nattapong', 'Palungmai', '1234567890160', '1993-05-22', 'Male', 'nattapong.p@mitsubishi.co.th', '081-234-5638', 4, 2, '2019-01-14', 36000.00, 'Active'],
            ['EMP039', 'นางสาว', 'ศิริพร', 'ทองคำ', 'Siriporn', 'Thongkham', '1234567890161', '1996-09-13', 'Female', 'siriporn.t@mitsubishi.co.th', '081-234-5639', 5, 3, '2021-03-08', 31000.00, 'Active'],
            ['EMP040', 'นาย', 'วัชระ', 'กล้าแกร่ง', 'Watchara', 'Klakraeng', '1234567890162', '1985-12-28', 'Male', 'watchara.k@mitsubishi.co.th', '081-234-5640', 5, 4, '2015-08-10', 43000.00, 'Active'],
            ['EMP041', 'นาย', 'ไพโรจน์', 'สุขสม', 'Pairoj', 'Suksom', '1234567890163', '1988-03-11', 'Male', 'pairoj.s@mitsubishi.co.th', '081-234-5641', 1, 5, '2016-10-30', 35000.00, 'Active'],
            ['EMP042', 'นางสาว', 'สุภาวดี', 'เนติกุล', 'Supawadee', 'Netikul', '1234567890164', '1991-07-07', 'Female', 'supawadee.n@mitsubishi.co.th', '081-234-5642', 1, 6, '2018-04-23', 28000.00, 'Active'],
            ['EMP043', 'นาย', 'ดนัย', 'ชูชัย', 'Danai', 'Chuchai', '1234567890165', '1987-11-19', 'Male', 'danai.c@mitsubishi.co.th', '081-234-5643', 2, 1, '2016-02-08', 47000.00, 'Active'],
            ['EMP044', 'นาง', 'สุมาลี', 'จันทร์สว่าง', 'Sumalee', 'Jansawang', '1234567890166', '1983-04-26', 'Female', 'sumalee.j@mitsubishi.co.th', '081-234-5644', 2, 2, '2013-09-16', 51000.00, 'Active'],
            ['EMP045', 'นาย', 'รังสรรค์', 'สร้างสรร', 'Rangsan', 'Sangson', '1234567890167', '1990-08-03', 'Male', 'rangsan.s@mitsubishi.co.th', '081-234-5645', 3, 3, '2017-12-04', 37000.00, 'Active'],
            ['EMP046', 'นางสาว', 'ปิยนุช', 'แพรวพราว', 'Piyanuch', 'Praewprao', '1234567890168', '1994-01-20', 'Female', 'piyanuch.p@mitsubishi.co.th', '081-234-5646', 3, 4, '2019-07-15', 33000.00, 'Active'],
            ['EMP047', 'นาย', 'อรรถพล', 'ใจหาญ', 'Attapon', 'Jaihan', '1234567890169', '1986-05-08', 'Male', 'attapon.j@mitsubishi.co.th', '081-234-5647', 4, 5, '2015-12-21', 34000.00, 'Active'],
            ['EMP048', 'นาย', 'สิทธิชัย', 'รุ่งเรือง', 'Sittichai', 'Rungrueang', '1234567890170', '1989-09-14', 'Male', 'sittichai.r@mitsubishi.co.th', '081-234-5648', 4, 6, '2017-06-05', 30000.00, 'Active'],
            ['EMP049', 'นางสาว', 'นันทนา', 'บัวทอง', 'Nantana', 'Buathong', '1234567890171', '1992-12-01', 'Female', 'nantana.b@mitsubishi.co.th', '081-234-5649', 5, 2, '2018-11-19', 37000.00, 'Active'],
            ['EMP050', 'นาย', 'ธวัชชัย', 'พัฒนา', 'Tawatchai', 'Pattana', '1234567890172', '1985-02-17', 'Male', 'tawatchai.p@mitsubishi.co.th', '081-234-5650', 5, 3, '2014-07-28', 41000.00, 'Active']
        ];

        // เพิ่มอีก 50 คน
        const moreEmployees = [
            ['EMP051', 'นาง', 'อุษา', 'สุดใจ', 'Usa', 'Sudjai', '1234567890173', '1981-06-23', 'Female', 'usa.s@mitsubishi.co.th', '081-234-5651', 1, 1, '2010-03-01', 55000.00, 'Active'],
            ['EMP052', 'นาย', 'เกรียงไกร', 'ทองใบ', 'Kriangkrai', 'Thongbai', '1234567890174', '1988-10-10', 'Male', 'kriangkrai.t@mitsubishi.co.th', '081-234-5652', 1, 4, '2016-09-12', 40000.00, 'Active'],
            ['EMP053', 'นางสาว', 'ภัทรา', 'สีสด', 'Pattra', 'Sisod', '1234567890175', '1993-03-28', 'Female', 'pattra.s@mitsubishi.co.th', '081-234-5653', 2, 5, '2019-02-18', 32000.00, 'Active'],
            ['EMP054', 'นาย', 'ชาตรี', 'ศิลป์ดี', 'Chatree', 'Sinlapde', '1234567890176', '1987-07-15', 'Male', 'chatree.s@mitsubishi.co.th', '081-234-5654', 2, 6, '2016-04-04', 31000.00, 'Active'],
            ['EMP055', 'นาย', 'อภิชาติ', 'พรหมดี', 'Apichat', 'Promdee', '1234567890177', '1984-11-02', 'Male', 'apichat.p@mitsubishi.co.th', '081-234-5655', 3, 2, '2014-10-13', 46000.00, 'Active'],
            ['EMP056', 'นางสาว', 'พัชรี', 'เกตุแก้ว', 'Patcharee', 'Ketkaew', '1234567890178', '1995-04-19', 'Female', 'patcharee.k@mitsubishi.co.th', '081-234-5656', 3, 3, '2020-08-24', 30000.00, 'Active'],
            ['EMP057', 'นาย', 'บัญชา', 'ธนาคม', 'Bancha', 'Tanakham', '1234567890179', '1986-08-26', 'Male', 'bancha.t@mitsubishi.co.th', '081-234-5657', 4, 4, '2015-06-15', 42000.00, 'Active'],
            ['EMP058', 'นาง', 'ละออง', 'ดาวดี', 'Laong', 'Daodee', '1234567890180', '1982-12-12', 'Female', 'laong.d@mitsubishi.co.th', '081-234-5658', 4, 1, '2012-05-07', 53000.00, 'Active'],
            ['EMP059', 'นาย', 'สุทธิพงษ์', 'มงคล', 'Suttipong', 'Mongkol', '1234567890181', '1991-05-30', 'Male', 'suttipong.m@mitsubishi.co.th', '081-234-5659', 5, 5, '2018-02-26', 34000.00, 'Active'],
            ['EMP060', 'นางสาว', 'จุฑามาศ', 'รัตนพันธ์', 'Jutamas', 'Rattanapan', '1234567890182', '1996-10-06', 'Female', 'jutamas.r@mitsubishi.co.th', '081-234-5660', 5, 6, '2021-09-20', 26000.00, 'Active'],
            ['EMP061', 'นาย', 'สมพงษ์', 'เจริญดี', 'Sompong', 'Charoendee', '1234567890183', '1985-01-24', 'Male', 'sompong.c@mitsubishi.co.th', '081-234-5661', 1, 2, '2015-04-06', 38000.00, 'Active'],
            ['EMP062', 'นาย', 'ประสิทธิ์', 'วงศ์ทอง', 'Prasit', 'Wongthong', '1234567890184', '1989-06-11', 'Male', 'prasit.w@mitsubishi.co.th', '081-234-5662', 1, 3, '2017-08-21', 36000.00, 'Active'],
            ['EMP063', 'นางสาว', 'สาวิตรี', 'ศรีงาม', 'Sawitree', 'Sringam', '1234567890185', '1992-09-17', 'Female', 'sawitree.s@mitsubishi.co.th', '081-234-5663', 2, 4, '2018-12-10', 35000.00, 'Active'],
            ['EMP064', 'นาย', 'วรวุฒิ', 'ใจกล้า', 'Worawut', 'Jaikla', '1234567890186', '1983-02-03', 'Male', 'worawut.j@mitsubishi.co.th', '081-234-5664', 2, 1, '2013-07-15', 50000.00, 'Active'],
            ['EMP065', 'นาง', 'สุรีย์', 'แก้วมุกดา', 'Suree', 'Kaewmukda', '1234567890187', '1980-05-09', 'Female', 'suree.k@mitsubishi.co.th', '081-234-5665', 3, 2, '2009-11-02', 56000.00, 'Active'],
            ['EMP066', 'นาย', 'จักรพงษ์', 'ภูมิใจ', 'Jakkrapong', 'Poomjai', '1234567890188', '1990-11-26', 'Male', 'jakkrapong.p@mitsubishi.co.th', '081-234-5666', 3, 5, '2017-05-29', 35000.00, 'Active'],
            ['EMP067', 'นางสาว', 'เบญจมาศ', 'ดอกไม้', 'Benchamas', 'Dokmai', '1234567890189', '1994-07-04', 'Female', 'benchamas.d@mitsubishi.co.th', '081-234-5667', 4, 6, '2019-10-07', 29000.00, 'Active'],
            ['EMP068', 'นาย', 'ณรงค์', 'เพียรพยายาม', 'Narong', 'Pieanpayayam', '1234567890190', '1986-03-21', 'Male', 'narong.p@mitsubishi.co.th', '081-234-5668', 4, 3, '2015-10-19', 39000.00, 'Active'],
            ['EMP069', 'นาย', 'สุรศักดิ์', 'หาญกล้า', 'Surasak', 'Hankla', '1234567890191', '1988-12-08', 'Male', 'surasak.h@mitsubishi.co.th', '081-234-5669', 5, 4, '2016-08-14', 41000.00, 'Active'],
            ['EMP070', 'นางสาว', 'นิตยา', 'พิมพ์ทอง', 'Nitaya', 'Pimthong', '1234567890192', '1991-01-15', 'Female', 'nitaya.p@mitsubishi.co.th', '081-234-5670', 5, 2, '2018-05-07', 37000.00, 'Active'],
            ['EMP071', 'นาย', 'ชูชาติ', 'ศรีสว่าง', 'Chuchat', 'Srisawang', '1234567890193', '1987-04-01', 'Male', 'chuchat.s@mitsubishi.co.th', '081-234-5671', 1, 5, '2016-11-28', 34000.00, 'Active'],
            ['EMP072', 'นาง', 'ศิริพร', 'มณีงาม', 'Siriporn', 'Maneengam', '1234567890194', '1984-08-18', 'Female', 'siriporn.m@mitsubishi.co.th', '081-234-5672', 1, 1, '2014-03-24', 48000.00, 'Active'],
            ['EMP073', 'นาย', 'กฤษณะ', 'สุขทวี', 'Kritsana', 'Suktawee', '1234567890195', '1993-11-05', 'Male', 'kritsana.s@mitsubishi.co.th', '081-234-5673', 2, 6, '2019-06-17', 28000.00, 'Active'],
            ['EMP074', 'นางสาว', 'อัญชลี', 'ดีใจ', 'Anchalee', 'Deejai', '1234567890196', '1990-02-22', 'Female', 'anchalee.d@mitsubishi.co.th', '081-234-5674', 2, 3, '2017-04-10', 36000.00, 'Active'],
            ['EMP075', 'นาย', 'วิโรจน์', 'ทรัพย์สิน', 'Wiroj', 'Sapsin', '1234567890197', '1985-06-29', 'Male', 'wiroj.s@mitsubishi.co.th', '081-234-5675', 3, 4, '2015-01-12', 43000.00, 'Active'],
            ['EMP076', 'นาย', 'อนันต์', 'มั่นมี', 'Anan', 'Manmee', '1234567890198', '1989-10-16', 'Male', 'anan.m@mitsubishi.co.th', '081-234-5676', 3, 5, '2017-09-25', 35000.00, 'Active'],
            ['EMP077', 'นางสาว', 'พรรณี', 'สุกใส', 'Pannee', 'Suksai', '1234567890199', '1995-03-03', 'Female', 'pannee.s@mitsubishi.co.th', '081-234-5677', 4, 2, '2020-07-13', 33000.00, 'Active'],
            ['EMP078', 'นาย', 'ชัยณรงค์', 'พลพัฒน์', 'Chainarong', 'Polpat', '1234567890200', '1986-07-20', 'Male', 'chainarong.p@mitsubishi.co.th', '081-234-5678', 4, 4, '2015-05-04', 42000.00, 'Active'],
            ['EMP079', 'นาง', 'สมจิตร', 'เดชา', 'Somjit', 'Decha', '1234567890201', '1982-11-27', 'Female', 'somjit.d@mitsubishi.co.th', '081-234-5679', 5, 1, '2012-09-10', 52000.00, 'Active'],
            ['EMP080', 'นาย', 'ธีระ', 'แกร่งกล้า', 'Teera', 'Kraengkla', '1234567890202', '1991-04-14', 'Male', 'teera.k@mitsubishi.co.th', '081-234-5680', 5, 3, '2018-01-08', 36000.00, 'Active'],
            ['EMP081', 'นางสาว', 'กาญจนา', 'เพชรน้ำหนึ่ง', 'Kanchana', 'Phetnamnung', '1234567890203', '1996-08-31', 'Female', 'kanchana.p@mitsubishi.co.th', '081-234-5681', 1, 6, '2021-04-19', 27000.00, 'Active'],
            ['EMP082', 'นาย', 'มนัส', 'ผลดี', 'Manat', 'Pondee', '1234567890204', '1987-12-07', 'Male', 'manat.p@mitsubishi.co.th', '081-234-5682', 1, 4, '2016-06-20', 40000.00, 'Active'],
            ['EMP083', 'นาย', 'ทศพล', 'กล้าหาญ', 'Totsapon', 'Klahan', '1234567890205', '1984-05-24', 'Male', 'totsapon.k@mitsubishi.co.th', '081-234-5683', 2, 2, '2014-12-08', 45000.00, 'Active'],
            ['EMP084', 'นางสาว', 'วิภา', 'สุขสว่าง', 'Wipa', 'Suksawang', '1234567890206', '1992-09-11', 'Female', 'wipa.s@mitsubishi.co.th', '081-234-5684', 2, 5, '2018-10-15', 33000.00, 'Active'],
            ['EMP085', 'นาย', 'เจษฎา', 'ชื่นบาน', 'Jetsada', 'Chuenban', '1234567890207', '1988-01-28', 'Male', 'jetsada.c@mitsubishi.co.th', '081-234-5685', 3, 3, '2016-03-14', 37000.00, 'Active'],
            ['EMP086', 'นาง', 'พจนีย์', 'ดีสุด', 'Potjanee', 'Deesud', '1234567890208', '1983-06-05', 'Female', 'potjanee.d@mitsubishi.co.th', '081-234-5686', 3, 1, '2013-10-21', 51000.00, 'Active'],
            ['EMP087', 'นาย', 'ภาคภูมิ', 'เจริญรุ่ง', 'Pakpoom', 'Charoenrung', '1234567890209', '1990-10-22', 'Male', 'pakpoom.c@mitsubishi.co.th', '081-234-5687', 4, 6, '2017-07-24', 30000.00, 'Active'],
            ['EMP088', 'นางสาว', 'ญาณิศา', 'รักสุข', 'Yanisa', 'Raksuk', '1234567890210', '1994-02-09', 'Female', 'yanisa.r@mitsubishi.co.th', '081-234-5688', 4, 5, '2019-11-11', 32000.00, 'Active'],
            ['EMP089', 'นาย', 'สหชาติ', 'ธนารักษ์', 'Sahachat', 'Tanarak', '1234567890211', '1986-06-16', 'Male', 'sahachat.t@mitsubishi.co.th', '081-234-5689', 5, 4, '2015-03-30', 42000.00, 'Active'],
            ['EMP090', 'นาย', 'ชาคริต', 'พัฒนพงษ์', 'Chakrit', 'Pattanapong', '1234567890212', '1989-11-23', 'Male', 'chakrit.p@mitsubishi.co.th', '081-234-5690', 5, 2, '2017-02-06', 38000.00, 'Active'],
            ['EMP091', 'นางสาว', 'กมลชนก', 'ทิพย์สุวรรณ', 'Kamonchanok', 'Tipsuwan', '1234567890213', '1993-07-10', 'Female', 'kamonchanok.t@mitsubishi.co.th', '081-234-5691', 1, 3, '2019-05-13', 34000.00, 'Active'],
            ['EMP092', 'นาย', 'อำนาจ', 'มั่นสกุล', 'Amnaj', 'Mansakul', '1234567890214', '1985-12-17', 'Male', 'amnaj.m@mitsubishi.co.th', '081-234-5692', 1, 5, '2015-09-07', 35000.00, 'Active'],
            ['EMP093', 'นาง', 'จันทิมา', 'แสงสว่าง', 'Jantima', 'Sangsawang', '1234567890215', '1981-03-24', 'Female', 'jantima.s@mitsubishi.co.th', '081-234-5693', 2, 1, '2011-06-20', 54000.00, 'Active'],
            ['EMP094', 'นาย', 'สันติ', 'สงบใจ', 'Santi', 'Sangobjai', '1234567890216', '1988-08-01', 'Male', 'santi.s@mitsubishi.co.th', '081-234-5694', 2, 4, '2016-12-04', 40000.00, 'Active'],
            ['EMP095', 'นางสาว', 'ปาริชาติ', 'มาลัย', 'Parichat', 'Malai', '1234567890217', '1995-11-18', 'Female', 'parichat.m@mitsubishi.co.th', '081-234-5695', 3, 6, '2020-10-26', 28000.00, 'Active'],
            ['EMP096', 'นาย', 'ภานุวัฒน์', 'ก้าวหน้า', 'Panuwat', 'Kaona', '1234567890218', '1987-01-05', 'Male', 'panuwat.k@mitsubishi.co.th', '081-234-5696', 3, 2, '2016-01-18', 39000.00, 'Active'],
            ['EMP097', 'นาย', 'สมชาย', 'บุญมา', 'Somchai', 'Boonma', '1234567890219', '1984-04-12', 'Male', 'somchai.b@mitsubishi.co.th', '081-234-5697', 4, 3, '2014-08-25', 44000.00, 'Active'],
            ['EMP098', 'นางสาว', 'รัตนา', 'สุขสบาย', 'Rattana', 'Suksabai', '1234567890220', '1992-06-29', 'Female', 'rattana.s@mitsubishi.co.th', '081-234-5698', 4, 4, '2018-07-09', 35000.00, 'Active'],
            ['EMP099', 'นาย', 'ณัฐวุฒิ', 'ผลกำไร', 'Natthawut', 'Polkamrai', '1234567890221', '1990-09-06', 'Male', 'natthawut.p@mitsubishi.co.th', '081-234-5699', 5, 5, '2017-11-20', 34000.00, 'Active'],
            ['EMP100', 'นางสาว', 'ธนาภรณ์', 'ทองสุข', 'Tanaporn', 'Thongsuk', '1234567890222', '1997-02-13', 'Female', 'tanaporn.t@mitsubishi.co.th', '081-234-5700', 5, 6, '2022-01-10', 25000.00, 'Active']
        ];

        const allEmployees = [...employees, ...moreEmployees];

        for (const emp of allEmployees) {
            await connection.query(
                `INSERT INTO employees
                (employee_code, title, first_name, last_name, first_name_en, last_name_en,
                 national_id, birth_date, gender, email, phone, department_id, position_id,
                 hire_date, salary, employment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                emp
            );
        }

        console.log('✅ เพิ่มข้อมูลพนักงาน 100 คนเรียบร้อยแล้ว!');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        await connection.end();
    }
}

seedEmployees();
