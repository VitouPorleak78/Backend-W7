const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './attendance_db.sqlite',
  logging: false
});

const Student = sequelize.define('Student', {
  name: { type: DataTypes.STRING, allowNull: false }
});

const Class = sequelize.define('Class', {
  className: { type: DataTypes.STRING, allowNull: false }
});

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { 
    type: DataTypes.ENUM('Present', 'Absent', 'Late'), 
    allowNull: false, 
    defaultValue: 'Present' 
  }
});

Student.hasMany(AttendanceRecord, { onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Student);

// Class 1 - * AttendanceRecord
Class.hasMany(AttendanceRecord, { onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Class);

app.post('/attendance', async (req, res) => {
  try {
    const { studentId, date } = req.query;
    const { classId, status } = req.body;

    if (!studentId || !date || !classId) {
      return res.status(400).json({ error: "Missing studentId, date, or classId params." });
    }

    // Upsert logic: Update if record exists for student+class+date, otherwise create
    const [record, created] = await AttendanceRecord.findOrCreate({
      where: { StudentId: studentId, ClassId: classId, date: date },
      defaults: { status: status || 'Present' }
    });

    if (!created) {
      record.status = status || 'Present';
      await record.save();
    }

    res.status(201).json({ message: "Attendance marked successfully", record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /attendance?studentId=1&date=2025-06-17
 * Get attendance for a student on a specific date
 */
app.get('/attendance', async (req, res) => {
  try {
    const { studentId, date } = req.query;
    
    const records = await AttendanceRecord.findAll({
      where: { StudentId: studentId, date: date },
      include: [Class]
    });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /classes/:id/attendance
 * List attendance for all students in a class
 */
app.get('/classes/:id/attendance', async (req, res) => {
  try {
    const records = await AttendanceRecord.findAll({
      where: { ClassId: req.params.id },
      include: [Student]
    });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /students/:id/attendance
 * Get attendance summary for a student
 */
app.get('/students/:id/attendance', async (req, res) => {
  try {
    const records = await AttendanceRecord.findAll({
      where: { StudentId: req.params.id },
      include: [Class]
    });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    await sequelize.sync({ force: true });
    console.log(" Attendance Database synced successfully!");

    // Seed mock data for quick API testing
    const s1 = await Student.create({ name: "Porleak Vitou" });
    const s2 = await Student.create({ name: "Oeng Naly" });
    const c1 = await Class.create({ className: "Software Engineering - Year 2" });

    await AttendanceRecord.create({ StudentId: s1.id, ClassId: c1.id, date: "2025-06-17", status: "Present" });
    await AttendanceRecord.create({ StudentId: s2.id, ClassId: c1.id, date: "2025-06-17", status: "Late" });

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(` Attendance API Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
  }
}

startServer();