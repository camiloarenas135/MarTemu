/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Upload, AlertCircle, Save, X, Sparkles, Crop, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductVariant } from '../types';
import { supabase } from '../lib/supabase';
import { sanitizeString, DEFAULT_DESCRIPTIONS } from '../utils/sanitize';
import { parseCOP, formatCOP, calculateDiscountPercent } from '../utils/promoHelpers';

interface AdminCatalogProps {
  products: Product[];
  onRefresh: () => void;
  forceEditProduct?: Product | null;
  onClearForceEdit?: () => void;
}

const CATEGORIES = ['Tecnología', 'Hogar y Cocina', 'Moda', 'Belleza', 'Novedades'];

export default function AdminCatalog({ 
  products, 
  onRefresh, 
  forceEditProduct, 
  onClearForceEdit 
}: AdminCatalogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Form values
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [category, setCategory] = useState('Tecnología');
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  // Compression & upload state
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterStock, setFilterStock] = useState('Todos'); // 'Todos' | 'Disponible' | 'Agotado' | 'Critico'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom Confirmation Modals
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Lock body scroll and close delete product modal with Escape key
  useEffect(() => {
    if (deleteConfirmId) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setDeleteConfirmId(null);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [deleteConfirmId]);

  // Image Cropper States
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperIndex, setCropperIndex] = useState<number | null>(null);
  const [cropperFile, setCropperFile] = useState<File | null>(null);

  // Lock body scroll and close image cropper modal with Escape key
  useEffect(() => {
    if (cropperSrc) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCropperCancel();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [cropperSrc]);

  // Scroll to edit form when opened or product changes while editing
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        if (formRef.current) {
          const elementPosition = formRef.current.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - 100; // offset for sticky header (80px) + 20px spacing
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing, editingProduct]);

  // Product list filter logic
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || prod.category === filterCategory;
    
    let matchesStock = true;
    if (filterStock === 'Disponible') {
      matchesStock = prod.stock > 0;
    } else if (filterStock === 'Agotado') {
      matchesStock = prod.stock === 0;
    } else if (filterStock === 'Critico') {
      matchesStock = prod.stock > 0 && prod.stock <= 3;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStock]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const capitalizeTitle = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Triggered when clicking "Nuevo Producto"
  const handleStartCreate = () => {
    setEditingProduct({});
    setName('');
    setPrice('');
    setPromoPrice('');
    setCategory('Tecnología');
    setStock(10);
    setDescription(DEFAULT_DESCRIPTIONS['Tecnología'] || '');
    setImages([]);
    setVariants([]);
    setUploadError('');
    setIsEditing(true);
  };

  // Triggered when clicking "Editar"
  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(capitalizeTitle(prod.name));
    setPrice(prod.price);
    setPromoPrice(prod.promo_price || '');
    setCategory(prod.category);
    setStock(prod.stock);
    setDescription(prod.description || DEFAULT_DESCRIPTIONS[prod.category] || '');
    setImages(prod.images || []);
    setVariants(prod.variants || []);
    setUploadError('');
    setIsEditing(true);
  };

  // Expose starting edit to parent stats if needed
  React.useEffect(() => {
    if (forceEditProduct) {
      handleStartEdit(forceEditProduct);
      if (onClearForceEdit) onClearForceEdit();
    }
  }, [forceEditProduct, onClearForceEdit]);

  // CLIENT-SIDE WEBP IMAGE COMPRESSION ENGINE
  // Compresses and converts any upload (JPEG, PNG, WEBP, GIF) into high-efficiency WEBP format.
  const compressImageToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Create Canvas
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max LCP size boundary (e.g. max 1200px width/height)
          const MAX_DIMENSION = 1200;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context.'));
            return;
          }
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Export as compressed WebP blob (quality 0.8)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Image compression blob is null.'));
              }
            },
            'image/webp',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Error loading image object.'));
      };
      reader.onerror = () => reject(new Error('Error reading image file.'));
    });
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files.length > 0) {
      await processAndUploadFiles(e.target.files);
    }
  };

  const processAndUploadFiles = async (files: FileList) => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const currentCount = images.length;
    const remainingSlots = 20 - currentCount;
    const filesArray = Array.from(files);

    if (filesArray.length === 0) return;

    if (filesArray.length > remainingSlots) {
      if (remainingSlots === 0) {
        setUploadError('Límite de imágenes alcanzado. El máximo permitido es 20 imágenes.');
      } else {
        setUploadError(`Límite superado. Solo puedes agregar ${remainingSlots} imagen(es) más (límite de 20).`);
      }
      return;
    }

    // Single file logic: use the crop modal
    if (filesArray.length === 1) {
      const file = filesArray[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        setUploadError('Formato de archivo no permitido. Sube un JPG, PNG, WEBP o GIF.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropperSrc(event.target.result as string);
          setCropperIndex(null);
          setCropperFile(file);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Multiple files logic: upload directly with WebP compression
    setIsUploading(true);
    setUploadError('');
    const newUploadedUrls: string[] = [];

    for (const file of filesArray) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        setUploadError(`Formato no permitido en "${file.name}". Sube JPG, PNG, WEBP o GIF.`);
        setIsUploading(false);
        return;
      }

      try {
        setIsCompressing(true);
        const webpBlob = await compressImageToWebP(file);
        setIsCompressing(false);

        const compressedFile = new File([webpBlob], `${file.name.split('.')[0]}-${Date.now()}.webp`, { type: 'image/webp' });
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.webp`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, compressedFile);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          newUploadedUrls.push(publicUrlData.publicUrl);
        }
      } catch (err: any) {
        console.error('Error uploading multiple files:', err);
        setUploadError(`Error al procesar "${file.name}": ${err.message || 'Error desconocido'}`);
        setIsUploading(false);
        setIsCompressing(false);
        return;
      }
    }

    setImages((prev) => [...prev, ...newUploadedUrls]);
    setIsUploading(false);
    setIsCompressing(false);
  };

  const handleCropperConfirm = async (croppedBlob: Blob) => {
    setCropperSrc(null); // Close modal
    setIsUploading(true);
    setUploadError('');

    const isExisting = cropperIndex !== null;

    try {
      // Create cropped file in WebP format
      const croppedFile = new File([croppedBlob], `cropped-${Date.now()}.webp`, { type: 'image/webp' });
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.webp`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, croppedFile);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl || '';
      
      if (isExisting) {
        // Replace existing image in list
        setImages((prev) => {
          const copy = [...prev];
          copy[cropperIndex!] = publicUrl;
          return copy;
        });
      } else {
        // Add new image to list
        setImages((prev) => [...prev, publicUrl]);
      }
    } catch (err: any) {
      console.error('Cropper upload failed:', err);
      setUploadError(err.message || 'Error al subir la imagen recortada. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      setCropperIndex(null);
      setCropperFile(null);
    }
  };

  const handleCropperCancel = () => {
    setCropperSrc(null);
    setCropperIndex(null);
    setCropperFile(null);
  };

  const handleStartCropExisting = (imgUrl: string, index: number) => {
    setCropperSrc(imgUrl);
    setCropperIndex(index);
    setCropperFile(null);
  };

  // Add / Remove variant fields
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: price || '', image: '' }]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: string) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save changes (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (images.length === 0) {
      setUploadError('Por favor agrega al menos una foto del producto.');
      return;
    }

    if (promoPrice) {
      const origVal = parseCOP(price);
      const promoVal = parseCOP(promoPrice);
      if (promoVal >= origVal) {
        setUploadError('El precio promocional debe ser menor que el precio base.');
        return;
      }
    }

    const sanitizedName = sanitizeString(capitalizeTitle(name), 100);
    const sanitizedDescription = sanitizeString(description, 1000);
    
    // Clean and sanitize variants including their associated images
    const sanitizedVariants = variants.map(v => ({
      name: sanitizeString(v.name, 100),
      price: formatCOP(parseCOP(v.price)),
      image: v.image ? sanitizeString(v.image, 1000) : undefined
    })).filter(v => v.name.length > 0);

    const productPayload: Omit<Product, 'id' | 'created_at'> = {
      name: sanitizedName,
      price: formatCOP(parseCOP(price)),
      category,
      stock: Math.max(0, stock),
      description: sanitizedDescription,
      images,
      variants: sanitizedVariants,
      promo_price: promoPrice ? formatCOP(parseCOP(promoPrice)) : undefined
    };

    try {
      if (editingProduct?.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert(productPayload);

        if (error) throw error;
      }

      onRefresh();
      setIsEditing(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Save product error:', err);
      setUploadError(err.message || 'Error al guardar el producto.');
    }
  };

  // Delete product action
  const handleDeleteProduct = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;

      onRefresh();
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Delete product error:', err);
      setUploadError('No se pudo eliminar el producto de Supabase. Valida dependencias.');
    }
  };

  return (
    <div className="space-y-6" id="admin-catalog-tab">
      
      {/* Title & action banner */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-5">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-purple" />
          <h3 className="text-lg font-black text-brand-navy">Administración del Catálogo</h3>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 rounded-lg bg-brand-blue hover:bg-brand-purple text-white px-4 py-2 text-xs font-bold transition active:scale-95 shadow-sm shadow-brand-blue/10"
            id="btn-new-product"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {uploadError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* CREATION / EDITING FORM DRAWER */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-150 p-6 shadow-md overflow-hidden"
            id="product-form-panel"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h4 className="font-bold text-brand-navy text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-purple" />
                <span>{editingProduct?.id ? 'Editar Producto Seleccionado' : 'Crear Nuevo Producto en Catálogo'}</span>
              </h4>
              <button
                onClick={() => { setIsEditing(false); setEditingProduct(null); }}
                className="rounded-full p-1 hover:bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Form: Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="prod-name" className="text-[10px] font-bold text-gray-500 uppercase">Nombre Comercial</label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    placeholder="Ej. Taza de Café de Cerámica"
                    value={name}
                    onChange={(e) => setName(capitalizeTitle(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="prod-price" className="text-[10px] font-bold text-gray-500 uppercase">Precio Base (Text)</label>
                    <input
                      id="prod-price"
                      type="text"
                      required
                      placeholder="Ej. $15.000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prod-promo-price" className="text-[10px] font-bold text-gray-500 uppercase">Precio Promocional (Opcional)</label>
                    <input
                      id="prod-promo-price"
                      type="text"
                      placeholder="Ej. $12.000"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="prod-category" className="text-[10px] font-bold text-gray-500 uppercase">Categoría</label>
                    <select
                      id="prod-category"
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        if (!description || Object.values(DEFAULT_DESCRIPTIONS).includes(description)) {
                          setDescription(DEFAULT_DESCRIPTIONS[newCat] || '');
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prod-stock" className="text-[10px] font-bold text-gray-500 uppercase">Existencias Iniciales (Stock)</label>
                    <input
                      id="prod-stock"
                      type="number"
                      required
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="prod-desc" className="text-[10px] font-bold text-gray-500 uppercase">Descripción Detallada</label>
                  <textarea
                    id="prod-desc"
                    required
                    style={{ fieldSizing: 'content' }}
                    rows={3}
                    placeholder="Describe el producto, materiales, dimensiones, garantía..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden min-h-20"
                  />
                </div>
              </div>

              {/* Right Form: Images & Variants */}
              <div className="space-y-5">
                
                {/* Image Upload Zone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Fotos del Producto (WebP Automatizado)</label>
                  
                  {/* Drag and Drop Box */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-32 ${
                      dragActive 
                        ? 'border-brand-blue bg-brand-blue/5' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                    
                    {isCompressing ? (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-brand-purple animate-pulse">Optimizando y convirtiendo a WebP...</span>
                      </div>
                    ) : isUploading ? (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-brand-blue animate-bounce">Subiendo a Supabase Storage...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 font-bold block">Arrastra o haz clic para subir imágenes</span>
                        <span className="text-[10px] text-gray-400 mt-1">Sube hasta 20 imágenes a la vez. Compresión automática WebP.</span>
                      </>
                    )}
                  </div>

                  {/* Uploaded Images List previews */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200 shadow-xs group">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleStartCropExisting(img, idx)}
                              className="h-6 w-6 bg-white hover:bg-brand-blue hover:text-white text-gray-700 flex items-center justify-center rounded-full transition cursor-pointer"
                              title="Recortar / Ajustar"
                            >
                              <Crop className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="h-6 w-6 bg-white hover:bg-rose-600 hover:text-white text-gray-700 flex items-center justify-center rounded-full transition cursor-pointer"
                              title="Eliminar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variants Editor list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Variantes Dinámicas (Colores, Tallas)</label>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:text-brand-purple transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Añadir Variante</span>
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No se han definido variantes. El producto se venderá tal como está.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          {/* Mini preview thumbnail of the variant image */}
                          <div className="h-8 w-8 rounded border border-gray-250 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                            {v.image ? (
                              <img src={v.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Crop className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          
                          <input
                            type="text"
                            required
                            placeholder="Nombre (ej. Azul Mate)"
                            value={v.name}
                            onChange={(e) => handleUpdateVariant(i, 'name', e.target.value)}
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Precio (ej. $15.000)"
                            value={v.price}
                            onChange={(e) => handleUpdateVariant(i, 'price', e.target.value)}
                            className="w-24 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden shrink-0"
                          />

                          {/* Image Dropdown selector */}
                          <select
                            value={v.image || ''}
                            onChange={(e) => handleUpdateVariant(i, 'image', e.target.value)}
                            className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden cursor-pointer shrink-0"
                            title="Vincular Foto"
                          >
                            <option value="">Sin Foto</option>
                            {images.map((img, imgIdx) => (
                              <option key={imgIdx} value={img}>
                                Foto {imgIdx + 1}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(i)}
                            className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button bar */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditingProduct(null); }}
                    className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-brand-navy hover:bg-brand-blue text-white px-5 py-2.5 text-xs font-bold transition active:scale-95 shadow-md shadow-brand-navy/10"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Producto</span>
                  </button>
                </div>

              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-purple focus:outline-hidden"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-405" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Categoría:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Todos</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-gray-500 uppercase text-[10px]">Stock:</span>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Disponible">Disponibles</option>
              <option value="Agotado">Sin Existencias</option>
              <option value="Critico">Stock Crítico (≤3)</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCTS DIRECTORY TABLE/GRID */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4 hidden sm:table-cell">Categoría</th>
                <th className="px-6 py-4">Precio Base</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
              {paginatedProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                  {/* Product Column with Image */}
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-150 bg-gray-50 shrink-0">
                      <img src={prod.images?.[0] || ''} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block line-clamp-1">{prod.name}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">ID: {prod.id.slice(0, 8)}...</span>
                    </div>
                  </td>

                  {/* Category Column */}
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-700 uppercase">
                      {prod.category}
                    </span>
                  </td>

                  {/* Price Column */}
                  <td className="px-6 py-4">
                    {prod.promo_price ? (
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-rose-600">{prod.promo_price}</span>
                        <span className="text-[10px] text-gray-400 line-through">{prod.price}</span>
                        <span className="text-[9px] text-rose-700 font-bold bg-rose-50 border border-rose-100 rounded-sm px-1 py-0.2 mt-0.5 max-w-fit block">
                          {calculateDiscountPercent(prod.price, prod.promo_price)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-gray-800">{prod.price}</span>
                    )}
                  </td>

                  {/* Stock Column */}
                  <td className="px-6 py-4">
                    {prod.stock === 0 ? (
                      <span className="rounded-full bg-rose-550/10 text-rose-600 font-extrabold px-2 py-0.5 text-[10px] border border-rose-100">Sin Existencias</span>
                    ) : prod.stock <= 3 ? (
                      <span className="rounded-full bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 text-[10px] border border-amber-100 animate-pulse">Crítico ({prod.stock})</span>
                    ) : (
                      <span className="font-bold text-emerald-600">{prod.stock} unids.</span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="rounded-full p-2 text-brand-blue hover:bg-brand-blue/10 transition-colors"
                        title="Editar Producto"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(prod.id)}
                        className="rounded-full p-2 text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Eliminar de catálogo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
            <div className="text-xs text-gray-500">
              Mostrando <span className="font-bold text-gray-800">{paginatedProducts.length}</span> de <span className="font-bold text-gray-800">{filteredProducts.length}</span> productos
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-650 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
              <span className="text-xs font-bold text-gray-655 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-150">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-655 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM REACT DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setDeleteConfirmId(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertCircle className="h-6 w-6" />
                </div>
                
                <div>
                  <h4 className="text-sm font-black text-brand-navy">¿Eliminar Producto de Catálogo?</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Esta acción quitará el producto del catálogo público permanentemente. No aparecerá en exploraciones ni pedidos de WhatsApp.
                  </p>
                </div>

                <div className="w-full flex gap-3 pt-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition"
                  >
                    Conservar
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-bold transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE CROPPER MODAL */}
      {cropperSrc && (
        <ImageCropperModal
          src={cropperSrc}
          onConfirm={handleCropperConfirm}
          onCancel={handleCropperCancel}
        />
      )}

    </div>
  );
}

// ==========================================
// IMAGE CROPPER COMPONENT
// ==========================================
interface ImageCropperModalProps {
  src: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function ImageCropperModal({ src, onConfirm, onCancel }: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalDimensions({
      width: e.currentTarget.naturalWidth,
      height: e.currentTarget.naturalHeight
    });
  };

  const getDragCoords = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = (e: any) => {
    const coords = getDragCoords(e);
    setIsDragging(true);
    setStartDrag({
      x: coords.x - offset.x,
      y: coords.y - offset.y
    });
  };

  const handleMove = (e: any) => {
    if (!isDragging) return;
    const coords = getDragCoords(e);
    setOffset({
      x: coords.x - startDrag.x,
      y: coords.y - startDrag.y
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const ratio = naturalDimensions.width / naturalDimensions.height;
      let displayWidth = 320;
      let displayHeight = 320;
      if (ratio > 1) {
        displayWidth = 320 * ratio;
      } else {
        displayHeight = 320 / ratio;
      }

      const scaleFactor = 800 / 320;
      const w = displayWidth * zoom;
      const h = displayHeight * zoom;
      const left = 160 + offset.x - w / 2;
      const top = 160 + offset.y - h / 2;

      const drawW = w * scaleFactor;
      const drawH = h * scaleFactor;
      const drawLeft = left * scaleFactor;
      const drawTop = top * scaleFactor;

      // Fill canvas background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 800);

      // Draw image
      ctx.drawImage(img, drawLeft, drawTop, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onConfirm(blob);
          }
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => {
      alert('Error al cargar la imagen para procesar el recorte.');
    };
  };

  const ratio = naturalDimensions.width ? naturalDimensions.width / naturalDimensions.height : 1;
  let displayWidth = 320;
  let displayHeight = 320;
  if (naturalDimensions.width) {
    if (ratio > 1) {
      displayWidth = 320 * ratio;
    } else {
      displayHeight = 320 / ratio;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-150 flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-brand-navy to-brand-purple px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-brand-blue animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Ajustar e Imagen de Producto</h3>
          </div>
          <button onClick={onCancel} className="rounded-full bg-white/10 p-1 hover:bg-white/20 text-white cursor-pointer font-bold w-6 h-6 flex items-center justify-center">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-6">
          <p className="text-xs text-gray-550 text-center leading-relaxed">
            Arrastra la imagen para centrarla y usa la barra deslizante para hacer zoom. El recuadro representa el área final del producto.
          </p>

          {/* Viewport Mask */}
          <div 
            className="relative w-80 h-80 overflow-hidden rounded-xl border border-gray-250 bg-slate-100 flex items-center justify-center select-none shadow-inner cursor-move"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            {/* Viewport overlay lines (decorative grid for classic professional cropper feel) */}
            <div className="absolute inset-0 border border-white/25 pointer-events-none z-10"></div>
            <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-white/20 pointer-events-none z-10"></div>
            <div className="absolute inset-x-0 top-2/3 border-b border-dashed border-white/20 pointer-events-none z-10"></div>
            <div className="absolute inset-y-0 left-1/3 border-r border-dashed border-white/20 pointer-events-none z-10"></div>
            <div className="absolute inset-y-0 left-2/3 border-r border-dashed border-white/20 pointer-events-none z-10"></div>

            <img
              ref={imgRef}
              src={src}
              alt="Preview"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute max-w-none select-none will-change-transform"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
          </div>

          {/* Zoom Slider Control */}
          <div className="w-full space-y-1.5 px-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-gray-150 appearance-none cursor-pointer accent-brand-blue"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition active:scale-95 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-brand-navy hover:bg-brand-blue text-white px-5 py-2.5 text-xs font-bold transition active:scale-95 shadow-md shadow-brand-navy/10 cursor-pointer"
          >
            <Crop className="h-4 w-4" />
            <span>Recortar y Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
