import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IFoodCategory } from '../models/types.ts';
import { logAudit } from '../services/auditService.ts';

export function listCategories(req: AuthRequest, res: Response): void {
  const categoriesWithCounts = store.foodCategories.map((cat) => {
    const donationCount = store.donations.filter(
      (d) => d.category.toLowerCase() === cat.name.toLowerCase()
    ).length;
    return {
      ...cat,
      donationCount,
    };
  });

  res.json({ success: true, categories: categoriesWithCounts });
}

export function createCategory(req: AuthRequest, res: Response): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Only administrators can create categories.' });
    return;
  }

  const { name, description, icon, shelfLifeGuidance, foodHandlingTips, urgencyClassification } = req.body;

  if (!name || !description || !shelfLifeGuidance || !foodHandlingTips) {
    res.status(400).json({ success: false, error: 'All category parameters are required.' });
    return;
  }

  const newCategory: IFoodCategory = {
    _id: `cat-${Date.now()}`,
    name,
    description,
    icon: icon || 'Utensils',
    shelfLifeGuidance,
    foodHandlingTips,
    urgencyClassification: urgencyClassification || 'MEDIUM',
    active: true,
    createdAt: new Date().toISOString(),
  };

  store.foodCategories.push(newCategory);

  logAudit({
    action: 'CATEGORY_CREATED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Created new food category: ${name}`,
  });

  res.status(201).json({ success: true, category: newCategory });
}

export function updateCategory(req: AuthRequest, res: Response): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Only administrators can modify categories.' });
    return;
  }

  const { id } = req.params;
  const category = store.foodCategories.find((c) => c._id === id);

  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found.' });
    return;
  }

  const { name, description, icon, shelfLifeGuidance, foodHandlingTips, urgencyClassification, active } = req.body;

  if (name) category.name = name;
  if (description) category.description = description;
  if (icon) category.icon = icon;
  if (shelfLifeGuidance) category.shelfLifeGuidance = shelfLifeGuidance;
  if (foodHandlingTips) category.foodHandlingTips = foodHandlingTips;
  if (urgencyClassification) category.urgencyClassification = urgencyClassification;
  if (active !== undefined) category.active = active;

  res.json({ success: true, category });
}
