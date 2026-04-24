const Report = require('../models/Report');

// @desc    Create a report
// @route   POST /reports
// @access  Private (Lab only)
const createReport = async (req, res) => {
    try {
        const { patientId, labId, hospitalId, reportData, status } = req.body;

        if (!patientId || !labId || !reportData) {
            return res.status(400).json({ message: 'Please provide patientId, labId, and reportData' });
        }

        const report = await Report.create({
            patientId,
            labId,
            hospitalId,
            reportData,
            status: status || 'pending'
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reports by patient ID
// @route   GET /reports/:patientId
// @access  Private (Hospital & Patient & Lab)
const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Ensure patient is requesting their own report
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ message: 'Not authorized to view other patient reports' });
        }

        const reports = await Report.find({ patientId })
            .populate('labId', 'name location')
            .populate('hospitalId', 'name location')
            .populate('patientId', 'name email');

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a report
// @route   PUT /reports/:id
// @access  Private (Hospital only)
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reportData } = req.body;

        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Update fields
        if (status) report.status = status;
        if (reportData) report.reportData = reportData;

        const updatedReport = await report.save();

        res.status(200).json(updatedReport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReport,
    getPatientReports,
    updateReport
};
