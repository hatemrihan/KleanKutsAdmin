import { Schema, model, models } from 'mongoose';

const OrderProductSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  image: { type: String }
});

const CustomerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
});

const OrderSchema = new Schema({
  customer: { type: CustomerSchema, required: true },
  products: [OrderProductSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['instapay', 'InstaPay', 'INSTAPAY', 'cod', 'COD', 'cash', 'Cash on Delivery'],
    default: 'cod'
  },
  transactionScreenshot: { type: String },
  paymentVerified: { type: Boolean, default: false },
  notes: { type: String },
  orderDate: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  couponCode: { type: String },
  couponDiscount: { type: Number },
  ambassadorId: { type: Schema.Types.ObjectId, ref: 'Ambassador' }
}, {
  timestamps: true
});

// Export the model
const Order = models?.Order || model('Order', OrderSchema);
export { Order }; 