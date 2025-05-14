import mongoose from 'mongoose';

type NotificationData = {
  title: string;
  message: string;
  type: string;
  data: any;
};

type ApplicationNotification = {
  type: string;
  title: string;
  message: string;
  data: {
    email: string;
    name: string;
    applicationRef: string;
    [key: string]: any;
  };
};

/**
 * Send notification to appropriate channels (admin dashboard, email, etc.)
 */
export async function sendNotification(notification: ApplicationNotification): Promise<void> {
  try {
    // Log notification (for debugging)
    console.log('Sending notification:', notification);
    
    // Make sure MongoDB is connected
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // Save notification to database for admin dashboard display
    // This is a simplified implementation
    const Notification = mongoose.models.Notification || 
      mongoose.model('Notification', new mongoose.Schema({
        type: String,
        title: String,
        message: String,
        data: Object,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }));
    
    await Notification.create({
      ...notification,
      createdAt: new Date()
    });
    
    // In a production environment, you might also want to:
    // 1. Send email notifications to admins
    // 2. Trigger real-time updates via websockets
    // 3. Send push notifications to admins' devices
    
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notifications should fail gracefully
  }
}

/**
 * Send admin notification (internal utility)
 */
export async function sendAdminNotification(notification: NotificationData): Promise<void> {
  try {
    // Log notification
    console.log('Sending admin notification:', notification);
    
    // Make sure MongoDB is connected
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    // In the future, you might want to:
    // 1. Retrieve admin users who should receive this notification
    // 2. Send emails to these admins
    // 3. Store in a dedicated admin notifications collection
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
} 