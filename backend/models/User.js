import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 500000,
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  xpToNextLevel: {
    type: Number,
    default: 1000
  },
  rank: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum', 'Master'],
    default: 'Bronze'
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  theme: {
    type: String,
    enum: ['dark', 'neon', 'cyberpunk'],
    default: 'dark'
  },
  stats: {
    totalGames: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    playtime: { type: Number, default: 0 }, // in minutes
    lastActive: { type: Date, default: Date.now }
  },
  dailyReward: {
    lastClaimed: Date,
    streak: { type: Number, default: 0 },
    claimable: { type: Boolean, default: true }
  },
  achievements: [{
    id: String,
    unlockedAt: Date
  }],
  inventory: [{
    itemId: String,
    name: String,
    rarity: String,
    quantity: { type: Number, default: 1 },
    acquiredAt: Date
  }],
  friends: [{
    userId: mongoose.Schema.Types.ObjectId,
    addedAt: Date
  }],
  settings: {
    musicEnabled: { type: Boolean, default: true },
    soundsEnabled: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  prestige: {
    level: { type: Number, default: 0 },
    totalRebirth: { type: Number, default: 0 }
  },
  bananaUpgrades: {
    luckMultiplier: { type: Number, default: 1.0 },
    earningsMultiplier: { type: Number, default: 1.0 },
    xpMultiplier: { type: Number, default: 1.0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: String
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.email;
  return userObj;
};

// Method to update level based on XP
userSchema.methods.updateLevel = function() {
  while (this.xp >= this.xpToNextLevel) {
    this.xp -= this.xpToNextLevel;
    this.level += 1;
    this.xpToNextLevel = Math.floor(1000 * Math.pow(1.1, this.level - 1));
    
    // Update rank based on level
    if (this.level >= 100) this.rank = 'Master';
    else if (this.level >= 75) this.rank = 'Platinum';
    else if (this.level >= 50) this.rank = 'Diamond';
    else if (this.level >= 30) this.rank = 'Gold';
    else if (this.level >= 15) this.rank = 'Silver';
  }
};

// Method to add XP
userSchema.methods.addXP = function(amount) {
  this.xp += amount * this.bananaUpgrades.xpMultiplier;
  this.updateLevel();
};

// Method to adjust balance safely
userSchema.methods.adjustBalance = function(amount, reason = '') {
  const newBalance = this.balance + amount;
  
  // Prevent negative balance
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }
  
  this.balance = newBalance;
  
  if (amount > 0) {
    this.totalEarned += amount;
  } else {
    this.totalSpent += Math.abs(amount);
  }
  
  this.stats.totalProfit = this.totalEarned - this.totalSpent;
};

export default mongoose.model('User', userSchema);
