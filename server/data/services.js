// Service management data layer - MongoDB
import ServiceModel from '../models/Service.js';
import ServiceCategoryModel from '../models/ServiceCategory.js';

function formatService(service) {
  return {
    id: service._id.toString(),
    name: service.name,
    description: service.description,
    price: parseFloat(service.price),
    status: service.status,
    isFeatured: service.is_featured,
    icon: service.icon,
    category: service.category_id ? {
      id: service.category_id._id?.toString() || service.category_id.toString(),
      name: service.category_id.name,
      slug: service.category_id.slug
    } : null,
    createdAt: service.created_at,
    updatedAt: service.updated_at
  };
}

export async function getServices({ status, category, featured, search, page = 1, limit = 20 } = {}) {
  try {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category_id = category;
    if (featured !== undefined) filter.is_featured = featured;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      ServiceModel.find(filter).populate('category_id').sort({ created_at: -1 }).skip(skip).limit(limit),
      ServiceModel.countDocuments(filter)
    ]);

    return {
      success: true,
      services: data.map(formatService),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get services error:', error);
    return { success: false, services: [], total: 0 };
  }
}

export async function getServiceById(id) {
  try {
    const service = await ServiceModel.findById(id).populate('category_id');
    if (!service) return null;
    return formatService(service);
  } catch (error) {
    console.error('Get service error:', error);
    return null;
  }
}

export async function createService(serviceData) {
  try {
    const service = await ServiceModel.create({
      name: serviceData.name,
      description: serviceData.description,
      category_id: serviceData.category_id || null,
      price: serviceData.price,
      status: serviceData.status || 'active',
      is_featured: serviceData.is_featured || false,
      icon: serviceData.icon || null
    });
    const populated = await service.populate('category_id');
    return { success: true, service: formatService(populated) };
  } catch (error) {
    console.error('Create service error:', error);
    return { success: false, message: 'Failed to create service' };
  }
}

export async function updateService(id, updates) {
  try {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    updateData.updated_at = new Date();

    const service = await ServiceModel.findByIdAndUpdate(id, updateData, { new: true }).populate('category_id');
    if (!service) return { success: false, message: 'Service not found' };
    return { success: true, service: formatService(service) };
  } catch (error) {
    console.error('Update service error:', error);
    return { success: false, message: 'Failed to update service' };
  }
}

export async function deleteService(id) {
  try {
    await ServiceModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error('Delete service error:', error);
    return { success: false, message: 'Failed to delete service' };
  }
}

export async function toggleFeatured(id) {
  try {
    const service = await ServiceModel.findById(id);
    if (!service) return { success: false, message: 'Service not found' };

    service.is_featured = !service.is_featured;
    await service.save();
    const populated = await service.populate('category_id');
    return { success: true, service: formatService(populated) };
  } catch (error) {
    console.error('Toggle featured error:', error);
    return { success: false, message: 'Database error' };
  }
}

export async function toggleServiceStatus(id) {
  try {
    const service = await ServiceModel.findById(id);
    if (!service) return { success: false, message: 'Service not found' };

    service.status = service.status === 'active' ? 'inactive' : 'active';
    await service.save();
    const populated = await service.populate('category_id');
    return { success: true, service: formatService(populated) };
  } catch (error) {
    console.error('Toggle status error:', error);
    return { success: false, message: 'Database error' };
  }
}

export async function getServiceCategories() {
  try {
    return await ServiceCategoryModel.find().sort({ name: 1 });
  } catch (error) {
    console.error('Get categories error:', error);
    return [];
  }
}

export async function createServiceCategory(name, slug) {
  try {
    const category = await ServiceCategoryModel.create({ name, slug });
    return { success: true, category };
  } catch (error) {
    return { success: false, message: 'Failed to create category' };
  }
}
