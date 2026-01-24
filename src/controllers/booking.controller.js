import Booking from '../models/Booking.model.js';
import Package from '../models/Package.model.js';

// Get all bookings (Admin/Manager: semua, Customer: miliknya saja)
export const getAllBookings = async (req, res) => {
  try {
    const filter = {};
    
    // Jika customer, hanya tampilkan booking miliknya
    if (req.user.role === 'customer') {
      filter.user = req.user.id;
    }
    
    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('package', 'name price category')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single booking
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('package')
      .populate('approvedBy', 'name');
      
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Customer hanya bisa lihat booking miliknya
    if (req.user.role === 'customer' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create booking (Customer)
export const createBooking = async (req, res) => {
  try {
    const { packageId, bookingDate, bookingTime, customerName, customerPhone, customerEmail, notes } = req.body;
    
    // Validasi package exists
    const package_ = await Package.findById(packageId);
    if (!package_) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    if (!package_.isActive) {
      return res.status(400).json({ success: false, message: 'Package is not available' });
    }
    
    // Cek apakah tanggal dan waktu sudah dibooking
    const existingBooking = await Booking.findOne({
      package: packageId,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'This time slot is already booked' 
      });
    }
    
    const newBooking = await Booking.create({
      user: req.user.id,
      package: packageId,
      bookingDate: new Date(bookingDate),
      bookingTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      totalPrice: package_.price,
      status: 'pending'
    });
    
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('package', 'name price category');
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully. Waiting for approval.', 
      data: populatedBooking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update booking status (Manager/Admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = status;
    
    if (status === 'approved') {
      booking.approvedBy = req.user.id;
      booking.approvedAt = new Date();
    }
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('package', 'name price category')
      .populate('approvedBy', 'name');
    
    res.json({ 
      success: true, 
      message: `Booking ${status} successfully`, 
      data: updatedBooking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status (Admin)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('user package');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Payment status updated', 
      data: booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel booking (Customer - hanya bisa cancel booking miliknya yang pending)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Validasi: hanya user yang buat booking yang bisa cancel
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Hanya bisa cancel jika status pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be cancelled' 
      });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete booking (Admin only)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking statistics (Admin/Manager)
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};