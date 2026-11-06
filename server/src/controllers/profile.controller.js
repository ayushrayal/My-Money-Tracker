import { User } from '../models/user.model.js';

/**
 * GET /api/profile
 * Get authenticated user profile with preferences and account creation date
 */
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar || '',
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/profile
 * Update user display name, avatar, and/or email (with uniqueness check)
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check email uniqueness if email is changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email address is already in use by another account',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/profile/change-password
 * Change password with current password verification
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    // Load user with passwordHash
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash and save new password
    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/profile/preferences
 * Update financial & UI preferences without affecting historical data
 */
export async function updatePreferences(req, res, next) {
  try {
    const { currency, budgetStartDay, defaultSalary, dashboard, notifications } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    if (currency) {
      user.preferences.currency = currency.toUpperCase().trim();
      user.currency = user.preferences.currency;
    }

    if (budgetStartDay !== undefined) {
      user.preferences.budgetStartDay = budgetStartDay;
    }

    if (defaultSalary !== undefined) {
      user.preferences.defaultSalary = defaultSalary;
    }

    if (dashboard) {
      user.preferences.dashboard = {
        ...user.preferences.dashboard,
        ...dashboard,
      };
    }

    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications,
      };
    }

    user.markModified('preferences');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

