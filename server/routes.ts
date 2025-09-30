import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple authentication - in production, use proper password hashing
      if (email === "admin@example.com" && password === "admin123") {
        const user = {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          title: "System Administrator",
          isAdmin: true,
          createdAt: new Date().toISOString()
        };
        
        res.json({
          success: true,
          message: "Login successful",
          data: user
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({
      success: true,
      message: "Logout successful"
    });
  });

  app.get("/api/auth/me", (req, res) => {
    // In a real app, this would check session/token
    const user = {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      title: "System Administrator",
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: user
    });
  });

  // Admin routes
  app.get("/api/admin/stats", (req, res) => {
    res.json({
      success: true,
      data: {
        totalUsers: 150,
        activeSessions: 23,
        systemStatus: "Online"
      }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
