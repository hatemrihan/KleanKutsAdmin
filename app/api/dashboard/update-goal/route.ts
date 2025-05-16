import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import { Setting } from '../../../models/setting';

export async function POST(request: NextRequest) {
  try {
    await mongooseConnect();
    
    // Parse the request body
    const { monthlyGoal } = await request.json();
    
    // Validate the monthly goal
    if (typeof monthlyGoal !== 'number' || monthlyGoal < 0) {
      return NextResponse.json(
        { error: 'Monthly goal must be a positive number' },
        { status: 400 }
      );
    }
    
    // Find or create the monthly goal setting
    let setting = await Setting.findOne({ key: 'monthlyGoal' });
    
    if (setting) {
      // Update existing setting
      setting.value = monthlyGoal.toString();
      await setting.save();
    } else {
      // Create new setting
      await Setting.create({
        key: 'monthlyGoal',
        value: monthlyGoal.toString(),
        description: 'Monthly sales goal in L.E'
      });
    }
    
    return NextResponse.json({
      success: true,
      monthlyGoal
    });
  } catch (error) {
    console.error('Error updating monthly goal:', error);
    return NextResponse.json(
      { error: 'Failed to update monthly goal' },
      { status: 500 }
    );
  }
} 