import { NextRequest, NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import { Setting } from '../../../models/setting';

export async function POST(request: NextRequest) {
  try {
    console.log('Updating monthly goal...');
    await mongooseConnect();
    
    // Parse the request body
    const body = await request.json();
    const { monthlyGoal } = body;
    
    console.log('Received goal update request:', { monthlyGoal });
    
    // Validate the monthly goal
    if (typeof monthlyGoal !== 'number' || monthlyGoal < 0) {
      console.error('Invalid monthly goal value:', monthlyGoal);
      return NextResponse.json(
        { error: 'Monthly goal must be a positive number' },
        { status: 400 }
      );
    }
    
    // Find or create the monthly goal setting
    let setting = await Setting.findOne({ key: 'monthlyGoal' });
    
    if (setting) {
      // Update existing setting
      console.log('Updating existing monthly goal setting from', setting.value, 'to', monthlyGoal);
      setting.value = monthlyGoal.toString();
      await setting.save();
    } else {
      // Create new setting
      console.log('Creating new monthly goal setting with value', monthlyGoal);
      await Setting.create({
        key: 'monthlyGoal',
        value: monthlyGoal.toString(),
        description: 'Monthly sales goal in L.E'
      });
    }
    
    console.log('Monthly goal successfully updated to', monthlyGoal);
    
    return NextResponse.json({
      success: true,
      monthlyGoal
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating monthly goal:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update monthly goal', details: errorMessage },
      { status: 500 }
    );
  }
} 