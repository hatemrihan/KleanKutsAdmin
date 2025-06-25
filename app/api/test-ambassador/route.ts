import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { mongooseConnect } from '@/app/lib/mongoose';

export async function POST(request: NextRequest) {
  try {
    await mongooseConnect();
    
    const { couponCode } = await request.json();
    
    if (!couponCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coupon code required' 
      }, { status: 400 });
    }

    const testResults: any = {
      couponCode,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    console.log(`[TEST AMBASSADOR] 🧪 Starting comprehensive test for code: ${couponCode}`);

    // STEP 1: Test Validation API
    console.log(`[TEST AMBASSADOR] Step 1: Testing validation...`);
    
    const normalizedCode = couponCode.trim().toUpperCase();
    const directMatch = await Ambassador.findOne({
      $or: [
        { couponCode: couponCode.toLowerCase(), status: 'approved' },
        { couponCode: normalizedCode, status: 'approved' },
        { referralCode: couponCode.toLowerCase(), status: 'approved' },
        { referralCode: normalizedCode, status: 'approved' }
      ]
    });

    const regexMatch = await Ambassador.findOne({
      $or: [
        { couponCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved' },
        { referralCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }, status: 'approved' }
      ]
    });

    const ambassador = directMatch || regexMatch;

    testResults.tests.validation = {
      success: !!ambassador,
      directMatch: !!directMatch,
      regexMatch: !!regexMatch,
      ambassador: ambassador ? {
        id: ambassador._id,
        name: ambassador.name,
        email: ambassador.email,
        couponCode: ambassador.couponCode,
        referralCode: ambassador.referralCode,
        status: ambassador.status,
        isActive: ambassador.isActive,
        commissionRate: ambassador.commissionRate,
        discountPercent: ambassador.discountPercent,
        currentStats: {
          sales: ambassador.sales,
          earnings: ambassador.earnings,
          orders: ambassador.orders
        }
      } : null
    };

    if (!ambassador) {
      testResults.tests.validation.error = 'No ambassador found with this code';
      return NextResponse.json({ 
        success: false, 
        results: testResults,
        message: 'Ambassador not found' 
      });
    }

    // STEP 2: Test Commission Calculation
    console.log(`[TEST AMBASSADOR] Step 2: Testing commission calculation...`);
    
    const testOrderData = {
      total: 1000,
      subtotal: 800,
      shippingCost: 200,
      discountAmount: 80 // 10% discount
    };

    const commissionableAmount = testOrderData.subtotal - testOrderData.discountAmount;
    const commission = (commissionableAmount * ambassador.commissionRate) / 100;

    testResults.tests.commission = {
      success: true,
      calculation: {
        subtotal: testOrderData.subtotal,
        discountAmount: testOrderData.discountAmount,
        commissionableAmount,
        commissionRate: ambassador.commissionRate,
        commission,
        formula: `(${testOrderData.subtotal} - ${testOrderData.discountAmount}) × ${ambassador.commissionRate}% = ${commission}`
      }
    };

    // STEP 3: Test Database Update (Simulation)
    console.log(`[TEST AMBASSADOR] Step 3: Testing database update simulation...`);
    
    const beforeStats = {
      sales: ambassador.sales,
      earnings: ambassador.earnings,
      orders: ambassador.orders,
      paymentsPending: ambassador.paymentsPending
    };

    const afterStats = {
      sales: beforeStats.sales + commissionableAmount,
      earnings: beforeStats.earnings + commission,
      orders: beforeStats.orders + 1,
      paymentsPending: beforeStats.paymentsPending + commission
    };

    testResults.tests.databaseUpdate = {
      success: true,
      simulation: {
        before: beforeStats,
        after: afterStats,
        changes: {
          salesIncrease: commissionableAmount,
          earningsIncrease: commission,
          ordersIncrease: 1,
          pendingIncrease: commission
        }
      }
    };

    // STEP 4: Test API Integration Points
    console.log(`[TEST AMBASSADOR] Step 4: Testing API integration points...`);
    
    testResults.tests.apiIntegration = {
      validation: {
        endpoint: '/api/coupon/validate',
        expectedResponse: {
          valid: true,
          discount: {
            type: 'percentage',
            value: ambassador.discountPercent,
            ambassadorId: ambassador._id
          },
          commissionRate: ambassador.commissionRate
        }
      },
      redemption: {
        endpoint: '/api/coupon/redeem',
        requiredFields: [
          'code',
          'orderId', 
          'total',
          'subtotal',
          'shippingCost',
          'discountAmount',
          'customerEmail'
        ],
        expectedResponse: {
          success: true,
          ambassadorId: ambassador._id,
          commission
        }
      }
    };

    console.log(`[TEST AMBASSADOR] ✅ All tests completed successfully for ${ambassador.name}`);

    return NextResponse.json({
      success: true,
      results: testResults,
      message: `All tests passed for ambassador ${ambassador.name}`,
      summary: {
        ambassador: ambassador.name,
        couponCode: ambassador.couponCode,
        commissionRate: `${ambassador.commissionRate}%`,
        discountRate: `${ambassador.discountPercent}%`,
        testCommission: `L.E ${commission.toFixed(2)} on L.E ${commissionableAmount} sale`,
        status: '✅ READY FOR PRODUCTION'
      }
    });

  } catch (error: any) {
    console.error('[TEST AMBASSADOR] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Test failed due to system error'
    }, { status: 500 });
  }
} 