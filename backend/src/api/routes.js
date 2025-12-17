// REST API Routes
// HTTP endpoints for frontend to fetch data and send commands

const express = require('express');
const router = express.Router();

/**
 * Initialize routes with service dependencies
 * @param {DatabaseService} dbService - Database service instance
 * @param {SerialTransport} transport - Transport instance for sending commands
 */
function initializeRoutes(dbService, transport) {
  
  // GET /api/status - Check backend status
  router.get('/status', (req, res) => {
    res.json({
      status: 'online',
      transport: transport.name,
      timestamp: new Date()
    });
  });

  // GET /api/latest - Get most recent sensor reading
  router.get('/latest', async (req, res) => {
    try {
      const latest = await dbService.getLatestReading();
      
      if (!latest) {
        return res.status(404).json({
          error: 'No sensor data available'
        });
      }

      res.json(latest);
    } catch (error) {
      console.error('[API] Error fetching latest reading:', error.message);
      res.status(500).json({
        error: 'Failed to fetch latest reading',
        message: error.message
      });
    }
  });

  // GET /api/history - Get historical sensor readings
  // Query params: ?limit=100&offset=0
  router.get('/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      // Validate limits
      if (limit > 1000) {
        return res.status(400).json({
          error: 'Limit cannot exceed 1000'
        });
      }

      const history = await dbService.getHistory(limit, offset);
      
      res.json({
        count: history.length,
        limit: limit,
        offset: offset,
        data: history  // Array of sensor readings
      });
    } catch (error) {
      console.error('[API] Error fetching history:', error.message);
      res.status(500).json({
        error: 'Failed to fetch history',
        message: error.message
      });
    }
  });

  // GET /api/statistics - Get statistics for a time range
  // Query params: ?start=2024-01-01&end=2024-01-31
  router.get('/statistics', async (req, res) => {
    try {
      const startTime = req.query.start ? new Date(req.query.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endTime = req.query.end ? new Date(req.query.end) : new Date();

      const stats = await dbService.getStatistics(startTime, endTime);
      
      res.json({
        period: {
          start: startTime,
          end: endTime
        },
        statistics: stats
      });
    } catch (error) {
      console.error('[API] Error fetching statistics:', error.message);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  });

  // POST /api/command - Send command to Arduino
  // Body: { "command": "MODE:MANUAL;LED:1;FAN:200" }
  router.post('/command', async (req, res) => {
    try {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({
          error: 'Command is required',
          example: { command: 'MODE:MANUAL;LED:1;FAN:200' }
        });
      }

      // Validate command format (basic check)
      if (typeof command !== 'string' || command.length === 0) {
        return res.status(400).json({
          error: 'Invalid command format'
        });
      }

      console.log(`[API] Sending command: ${command}`);
      
      await transport.sendCommand(command);
      
      res.json({
        success: true,
        command: command,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[API] Error sending command:', error.message);
      res.status(500).json({
        error: 'Failed to send command',
        message: error.message
      });
    }
  });

  // POST /api/control/mode - Set control mode (AUTO or MANUAL)
  // Body: { "mode": "AUTO" } or { "mode": "MANUAL" }
  router.post('/control/mode', async (req, res) => {
    try {
      const { mode } = req.body;

      if (!mode || (mode !== 'AUTO' && mode !== 'MANUAL')) {
        return res.status(400).json({
          error: 'Mode must be either "AUTO" or "MANUAL"'
        });
      }

      const command = `MODE:${mode}`;
      await transport.sendCommand(command);
      
      res.json({
        success: true,
        mode: mode,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[API] Error setting mode:', error.message);
      res.status(500).json({
        error: 'Failed to set mode',
        message: error.message
      });
    }
  });

  // POST /api/control/manual - Set manual controls
  // Body: { "led": 1, "fan": 200 }
  router.post('/control/manual', async (req, res) => {
    try {
      const { led, fan } = req.body;

      if (led === undefined && fan === undefined) {
        return res.status(400).json({
          error: 'At least one control parameter (led or fan) is required'
        });
      }

      let commandParts = ['MODE:MANUAL'];

      if (led !== undefined) {
        const ledValue = led ? 1 : 0;
        commandParts.push(`LED:${ledValue}`);
      }

      if (fan !== undefined) {
        const fanSpeed = Math.max(0, Math.min(255, parseInt(fan)));
        commandParts.push(`FAN:${fanSpeed}`);
      }

      const command = commandParts.join(';');
      await transport.sendCommand(command);
      
      res.json({
        success: true,
        command: command,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[API] Error setting manual controls:', error.message);
      res.status(500).json({
        error: 'Failed to set manual controls',
        message: error.message
      });
    }
  });

  // GET /api/history/analytics - Get detailed analytics for historical analysis
  // Query params: ?start=2024-01-01&end=2024-01-31
  router.get('/history/analytics', async (req, res) => {
    try {
      const startTime = req.query.start ? new Date(req.query.start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endTime = req.query.end ? new Date(req.query.end) : new Date();

      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)'
        });
      }

      if (startTime >= endTime) {
        return res.status(400).json({
          error: 'Start time must be before end time'
        });
      }

      const analytics = await dbService.getDetailedAnalytics(startTime, endTime);
      
      res.json({
        ...analytics,
        period: {
          start: startTime,
          end: endTime
        }
      });
    } catch (error) {
      console.error('[API] Error fetching analytics:', error.message);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  });

  return router;
}

module.exports = initializeRoutes;
