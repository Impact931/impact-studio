'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
  ADDONS,
  formatPrice,
} from '@/content/equipment-catalog';
import { RENTAL_AGREEMENT } from '@/content/rental-agreement';
import { BookingFormData, CartItem, EquipmentItem } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SignaturePad from '@/components/booking/SignaturePad';

const PRODUCTION_TYPES = [
  { value: 'corporate-headshots', label: 'Corporate Headshots' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'branding-marketing', label: 'Branding/Marketing' },
  { value: 'fashion-editorial', label: 'Fashion/Editorial' },
  { value: 'product-photography', label: 'Product Photography' },
  { value: 'video-production', label: 'Video Production' },
  { value: 'content-creation', label: 'Content Creation' },
  { value: 'other', label: 'Other' },
];

const SPECIAL_REQUIREMENTS = [
  { value: 'alcohol', label: 'Alcohol on premises' },
  { value: 'smoke-fog', label: 'Smoke / Fog machines' },
  { value: 'water', label: 'Water features' },
  { value: 'overhead-rigs', label: 'Overhead rigs' },
];

const STUDIO_RENTAL_MAP: Record<string, string> = {
  hourly: 'studio-hourly',
  half_day: 'studio-half-day',
  full_day: 'studio-full-day',
};

export default function BookingPage() {
  const { customer, loading: authLoading } = useAuth();
  const { items: cartItems, addItem: addToCart, removeItem: removeFromCart } = useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [cartSeeded, setCartSeeded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasScrolledAgreement, setHasScrolledAgreement] = useState(false);
  const agreementRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<BookingFormData>({
    renterName: '',
    company: '',
    phone: '',
    email: '',
    productionType: '',
    description: '',
    estimatedPeople: '',
    backgroundUsage: false,
    backgroundColor: '',
    specialRequirements: [],
    contentDisclosure: [],
    rentalDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    studioRentalType: 'none',
    equipment: [],
    rentalMode: 'in_studio',
    damageWaiver: false,
    offSiteEquipment: false,
    hasInsurance: false,
    insuranceProvider: '',
    signedName: '',
    signatureDataUrl: '',
    agreedToTerms: false,
  });

  // Pre-fill renter info from account
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        renterName: prev.renterName || customer.name,
        email: prev.email || customer.email,
        phone: prev.phone || customer.phone,
        company: prev.company || customer.company || '',
      }));
    }
  }, [customer]);

  // Seed booking wizard from cart items (once on mount)
  useEffect(() => {
    if (cartSeeded || cartItems.length === 0) return;
    setCartSeeded(true);

    const bundles = new Set<string>();
    const alacarte = new Set<string>();
    let studioType: BookingFormData['studioRentalType'] = 'none';
    let damageWaiver = false;

    for (const item of cartItems) {
      if (item.equipmentId.startsWith('studio-')) {
        const entry = Object.entries(STUDIO_RENTAL_MAP).find(
          ([, v]) => v === item.equipmentId,
        );
        if (entry) studioType = entry[0] as BookingFormData['studioRentalType'];
      } else if (item.equipmentId.startsWith('bundle-')) {
        bundles.add(item.equipmentId);
      } else if (item.equipmentId.startsWith('alacarte-')) {
        alacarte.add(item.equipmentId);
      } else if (item.equipmentId === 'addon-damage-waiver') {
        damageWaiver = true;
      }
    }

    setSelectedBundles(bundles);
    setSelectedAlacarte(alacarte);
    setForm((prev) => ({
      ...prev,
      studioRentalType: studioType,
      damageWaiver,
    }));
  }, [cartItems, cartSeeded]);

  const isInStudio = form.rentalMode === 'in_studio';

  // Dynamic steps based on rental mode
  // In-studio: includes Production Details step
  // Out-of-studio (equipment only): skips production details
  const STEPS = isInStudio
    ? ['Equipment Selection', 'Booking Details', 'Production Details', 'Insurance', 'Review & Sign', 'Checkout']
    : ['Equipment Selection', 'Booking Details', 'Insurance', 'Review & Sign', 'Checkout'];

  // Map step indices to content
  const getStepContent = (step: number): string => {
    return STEPS[step];
  };

  // --- Equipment selection state ---
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
  const [selectedAlacarte, setSelectedAlacarte] = useState<Set<string>>(new Set());

  // --- Build cart from selections ---
  const cart = useMemo(() => {
    const items: CartItem[] = [];

    // Studio rental (in-studio only)
    if (isInStudio && form.studioRentalType !== 'none') {
      const studioId = STUDIO_RENTAL_MAP[form.studioRentalType];
      const studioItem = STUDIO_RENTALS.find((r) => r.id === studioId);
      if (studioItem && studioItem.priceInStudio > 0) {
        items.push({
          equipmentId: studioItem.id,
          name: studioItem.name,
          price: studioItem.priceInStudio,
          quantity: 1,
        });
      }
    }

    // Bundles
    selectedBundles.forEach((id) => {
      const item = LIGHTING_BUNDLES.find((b) => b.id === id);
      if (item) {
        items.push({
          equipmentId: item.id,
          name: item.name,
          price: isInStudio ? item.priceInStudio : item.priceOutOfStudio,
          quantity: 1,
        });
      }
    });

    // A la carte — for out-of-studio, included items are NOT free
    selectedAlacarte.forEach((id) => {
      const item = ALACARTE_EQUIPMENT.find((a) => a.id === id);
      if (item) {
        const price = isInStudio ? item.priceInStudio : item.priceOutOfStudio;
        if (price > 0 || (!isInStudio && item.included)) {
          items.push({
            equipmentId: item.id,
            name: item.name,
            price: isInStudio ? item.priceInStudio : item.priceOutOfStudio,
            quantity: 1,
          });
        }
      }
    });

    // Damage waiver
    if (form.damageWaiver) {
      const waiver = ADDONS.find((a) => a.id === 'addon-damage-waiver');
      if (waiver) {
        items.push({
          equipmentId: waiver.id,
          name: waiver.name,
          price: isInStudio ? waiver.priceInStudio : waiver.priceOutOfStudio,
          quantity: 1,
        });
      }
    }

    return items;
  }, [
    form.studioRentalType,
    form.rentalMode,
    form.damageWaiver,
    isInStudio,
    selectedBundles,
    selectedAlacarte,
  ]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  // --- Helpers ---
  const updateForm = <K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleSet = (
    set: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleArrayItem = (key: 'specialRequirements' | 'contentDisclosure', value: string) => {
    setForm((prev) => {
      const arr = prev[key];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  // --- Validation ---
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    const stepName = getStepContent(step);

    if (stepName === 'Equipment Selection') {
      if (cart.length === 0) {
        errs.studioRentalType = 'Please select at least one item';
      }
    }

    if (stepName === 'Booking Details') {
      if (!form.rentalDate) errs.rentalDate = 'Start date is required';
      if (!form.endDate) errs.endDate = 'End date is required';
      if (form.rentalDate && form.endDate && form.endDate < form.rentalDate) {
        errs.endDate = 'End date cannot be before start date';
      }
      if (!form.startTime) errs.startTime = 'Start time is required';
      if (!form.endTime) errs.endTime = 'End time is required';
      if (!form.renterName.trim()) errs.renterName = 'Name is required';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = 'Valid email is required';
    }

    if (stepName === 'Production Details') {
      if (!form.productionType) errs.productionType = 'Production type is required';
    }

    if (stepName === 'Insurance') {
      if (form.hasInsurance && !form.insuranceProvider.trim()) {
        errs.insuranceProvider = 'Insurance provider is required';
      }
    }

    if (stepName === 'Review & Sign') {
      if (!hasScrolledAgreement)
        errs.agreement = 'Please scroll through the full agreement';
      if (!form.signedName.trim()) errs.signedName = 'Typed name is required';
      if (!form.signatureDataUrl)
        errs.signatureDataUrl = 'Signature is required';
      if (!form.agreedToTerms)
        errs.agreedToTerms = 'You must agree to the terms';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;

    // Sync equipment selections to the persistent cart when leaving Equipment Selection
    if (getStepContent(currentStep) === 'Equipment Selection') {
      // Remove cart items that are no longer selected in the wizard
      const selectedIds = new Set(cart.map((c) => c.equipmentId));
      for (const existing of cartItems) {
        if (!selectedIds.has(existing.equipmentId)) {
          removeFromCart(existing.equipmentId);
        }
      }
      // Add/update items from the wizard into the cart
      for (const item of cart) {
        const existing = cartItems.find((c) => c.equipmentId === item.equipmentId);
        if (!existing) {
          addToCart(item);
        }
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleAgreementScroll = () => {
    const el = agreementRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setHasScrolledAgreement(true);
  };

  const handleCheckout = async () => {
    if (!validateStep(currentStep)) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        equipment: cart,
        totalAmount: cartTotal,
      };

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setErrors({ checkout: err instanceof Error ? err.message : 'Checkout failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render helpers ---
  const renderEquipmentCheckbox = (
    item: EquipmentItem,
    checked: boolean,
    onToggle: () => void,
  ) => {
    const price = isInStudio ? item.priceInStudio : item.priceOutOfStudio;
    const included = isInStudio && item.included;

    return (
      <label
        key={item.id}
        className="flex items-center justify-between p-3 rounded-md border border-brand-border hover:border-brand-accent/50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="w-4 h-4 accent-brand-accent"
          />
          <div>
            <p className="text-sm text-brand-text">{item.name}</p>
            {item.description && (
              <p className="text-xs text-brand-muted">
                {/* Show different description for included items based on rental mode */}
                {item.included && !isInStudio
                  ? 'Required rental for out-of-studio use'
                  : item.description}
              </p>
            )}
          </div>
        </div>
        <span className="text-sm font-medium text-brand-accent">
          {included ? 'Included' : formatPrice(price)}
        </span>
      </label>
    );
  };

  const stepName = getStepContent(currentStep);
  const isCheckoutStep = stepName === 'Checkout';

  // --- Auth gate ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-text">
            Account Required
          </h1>
          <p className="mt-3 text-brand-muted">
            You need an account to book studio time or rent equipment. Create one
            in under a minute.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/account/create"
              className="rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Create Account
            </Link>
            <Link
              href="/account/login"
              className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-text"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-white text-brand-text">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <h1 className="text-3xl font-display font-bold text-brand-text mb-2">
          {isInStudio ? 'Book Studio & Equipment' : 'Rent Equipment'}
        </h1>
        <p className="text-brand-muted mb-8">
          {isInStudio
            ? 'Reserve studio time and equipment in just a few steps.'
            : 'Select equipment and complete checkout — no production details needed.'}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0
                  ${
                    idx === currentStep
                      ? 'bg-brand-accent text-white'
                      : idx < currentStep
                        ? 'bg-brand-accent-dim text-white'
                        : 'bg-brand-border text-brand-muted'
                  }
                `}
              >
                {idx + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap hidden sm:inline ${
                  idx === currentStep ? 'text-brand-accent' : 'text-brand-muted'
                }`}
              >
                {label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="w-6 h-px bg-brand-border shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            {/* ========== Equipment Selection ========== */}
            {stepName === 'Equipment Selection' && (
              <div className="space-y-6">
                {/* Rental Mode Toggle */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-2">
                    Rental Type
                  </h2>
                  <p className="text-xs text-brand-muted mb-4">
                    In-studio includes production details and stand usage. Out-of-studio is equipment rental only.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        updateForm('rentalMode', 'in_studio');
                        setCurrentStep(0);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        isInStudio
                          ? 'bg-brand-accent text-white'
                          : 'bg-brand-light text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      In-Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateForm('rentalMode', 'out_of_studio');
                        updateForm('studioRentalType', 'none');
                        setCurrentStep(0);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        !isInStudio
                          ? 'bg-brand-accent text-white'
                          : 'bg-brand-light text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      Equipment Only
                    </button>
                  </div>
                </div>

                {/* Studio Rental Type (in-studio only) */}
                {isInStudio && (
                  <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                    <h2 className="text-lg font-semibold text-brand-text mb-4">
                      Studio Rental
                    </h2>
                    {errors.studioRentalType && (
                      <p className="text-xs text-brand-red mb-2">
                        {errors.studioRentalType}
                      </p>
                    )}
                    <p className="text-xs text-brand-muted mb-2">
                      Optional — select if you need studio space.
                    </p>
                    <div className="flex flex-col gap-2">
                      {STUDIO_RENTALS.map((rental) => {
                        const type = Object.entries(STUDIO_RENTAL_MAP).find(
                          ([, v]) => v === rental.id,
                        )?.[0] as BookingFormData['studioRentalType'] | undefined;
                        const isSelected = STUDIO_RENTAL_MAP[form.studioRentalType] === rental.id;
                        return (
                          <label
                            key={rental.id}
                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-brand-accent bg-brand-accent/10'
                                : 'border-brand-border hover:border-brand-accent/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    updateForm('studioRentalType', 'none');
                                  } else if (type) {
                                    updateForm('studioRentalType', type);
                                  }
                                }}
                                className="w-4 h-4 accent-brand-accent"
                              />
                              <div>
                                <p className="text-sm text-brand-text">
                                  {rental.name}
                                </p>
                                {rental.description && (
                                  <p className="text-xs text-brand-muted">
                                    {rental.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-brand-accent">
                              {formatPrice(rental.priceInStudio)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lighting Bundles */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Lighting Bundles
                  </h2>
                  <div className="flex flex-col gap-2">
                    {LIGHTING_BUNDLES.map((bundle) =>
                      renderEquipmentCheckbox(
                        bundle,
                        selectedBundles.has(bundle.id),
                        () => toggleSet(selectedBundles, setSelectedBundles, bundle.id),
                      ),
                    )}
                  </div>
                </div>

                {/* A La Carte */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    A La Carte Equipment
                  </h2>
                  {!isInStudio && (
                    <p className="text-xs text-brand-muted mb-3">
                      All equipment is charged at out-of-studio rates. Stands are not included and must be rented separately.
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    {ALACARTE_EQUIPMENT.map((item) =>
                      renderEquipmentCheckbox(
                        item,
                        selectedAlacarte.has(item.id),
                        () =>
                          toggleSet(
                            selectedAlacarte,
                            setSelectedAlacarte,
                            item.id,
                          ),
                      ),
                    )}
                  </div>
                </div>

                {/* Damage Waiver */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Add-ons
                  </h2>
                  {ADDONS.map((addon) =>
                    renderEquipmentCheckbox(
                      addon,
                      form.damageWaiver && addon.id === 'addon-damage-waiver',
                      () => updateForm('damageWaiver', !form.damageWaiver),
                    ),
                  )}
                </div>
              </div>
            )}

            {/* ========== Booking Details ========== */}
            {stepName === 'Booking Details' && (
              <div className="space-y-6">
                {/* Date & Time */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Date &amp; Time
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={form.rentalDate}
                      onChange={(e) => {
                        updateForm('rentalDate', e.target.value);
                        // Auto-set end date if empty or before start
                        if (!form.endDate || form.endDate < e.target.value) {
                          updateForm('endDate', e.target.value);
                        }
                      }}
                      error={errors.rentalDate}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateForm('endDate', e.target.value)}
                      error={errors.endDate}
                    />
                    <Input
                      label="Start Time"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => updateForm('startTime', e.target.value)}
                      error={errors.startTime}
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => updateForm('endTime', e.target.value)}
                      error={errors.endTime}
                    />
                  </div>
                </div>

                {/* Renter Info */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Renter Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={form.renterName}
                      onChange={(e) => updateForm('renterName', e.target.value)}
                      error={errors.renterName}
                      required
                    />
                    <Input
                      label="Company"
                      value={form.company}
                      onChange={(e) => updateForm('company', e.target.value)}
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      error={errors.phone}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      error={errors.email}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========== Production Details (IN-STUDIO ONLY) ========== */}
            {stepName === 'Production Details' && (
              <div className="space-y-6">
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Production Details
                  </h2>
                  <div className="space-y-4">
                    <Select
                      label="Production Type"
                      options={PRODUCTION_TYPES}
                      placeholder="Select a production type"
                      value={form.productionType}
                      onChange={(e) =>
                        updateForm('productionType', e.target.value)
                      }
                      error={errors.productionType}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brand-text">
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          updateForm('description', e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 rounded-md text-sm bg-white border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                        placeholder="Describe your production..."
                      />
                    </div>
                    <Input
                      label="Estimated Number of People"
                      type="text"
                      value={form.estimatedPeople}
                      onChange={(e) =>
                        updateForm('estimatedPeople', e.target.value)
                      }
                      placeholder="e.g. 5"
                    />

                    {/* Background usage */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="backgroundUsage"
                        checked={form.backgroundUsage}
                        onChange={(e) =>
                          updateForm('backgroundUsage', e.target.checked)
                        }
                        className="w-4 h-4 accent-brand-accent"
                      />
                      <label
                        htmlFor="backgroundUsage"
                        className="text-sm text-brand-text"
                      >
                        Will you use a backdrop/background?
                      </label>
                    </div>
                    {form.backgroundUsage && (
                      <Input
                        label="Background Color"
                        value={form.backgroundColor}
                        onChange={(e) =>
                          updateForm('backgroundColor', e.target.value)
                        }
                        placeholder="e.g. White, Gray, Black"
                      />
                    )}
                  </div>
                </div>

                {/* Special Requirements */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Special Requirements
                  </h2>
                  <div className="space-y-2">
                    {SPECIAL_REQUIREMENTS.map((req) => (
                      <label
                        key={req.value}
                        className="flex items-center gap-3 p-2"
                      >
                        <input
                          type="checkbox"
                          checked={form.specialRequirements.includes(req.value)}
                          onChange={() =>
                            toggleArrayItem('specialRequirements', req.value)
                          }
                          className="w-4 h-4 accent-brand-accent"
                        />
                        <span className="text-sm text-brand-text">
                          {req.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== Insurance ========== */}
            {stepName === 'Insurance' && (
              <div className="space-y-6">
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Production Insurance
                  </h2>
                  <p className="text-sm text-brand-muted mb-4">
                    Do you have production insurance that covers rented
                    equipment?
                  </p>
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => updateForm('hasInsurance', true)}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        form.hasInsurance
                          ? 'bg-brand-accent text-white'
                          : 'bg-brand-light text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateForm('hasInsurance', false);
                        updateForm('insuranceProvider', '');
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        !form.hasInsurance
                          ? 'bg-brand-accent text-white'
                          : 'bg-brand-light text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      No
                    </button>
                  </div>

                  {form.hasInsurance ? (
                    <Input
                      label="Insurance Provider"
                      value={form.insuranceProvider}
                      onChange={(e) =>
                        updateForm('insuranceProvider', e.target.value)
                      }
                      error={errors.insuranceProvider}
                      placeholder="e.g. Hartford, State Farm"
                    />
                  ) : (
                    <div className="p-4 rounded-md bg-brand-accent/10 border border-brand-accent/30">
                      <p className="text-sm text-brand-accent font-medium mb-1">
                        Security Hold Required
                      </p>
                      <p className="text-sm text-brand-muted">
                        Without production insurance, a{' '}
                        <strong className="text-brand-text">$500.00</strong>{' '}
                        security hold will be authorized on your card. This hold
                        is not captured and will be released within 5 business
                        days after equipment is returned in satisfactory
                        condition.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== Review & Sign ========== */}
            {stepName === 'Review & Sign' && (
              <div className="space-y-6">
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Rental Agreement
                  </h2>
                  {errors.agreement && (
                    <p className="text-xs text-brand-red mb-2">
                      {errors.agreement}
                    </p>
                  )}
                  <div
                    ref={agreementRef}
                    onScroll={handleAgreementScroll}
                    className="h-64 overflow-y-auto p-4 rounded-md bg-brand-light border border-brand-border text-xs text-brand-muted whitespace-pre-wrap leading-relaxed"
                  >
                    {RENTAL_AGREEMENT}
                  </div>
                  <p className="text-xs text-brand-muted mt-2">
                    {hasScrolledAgreement
                      ? 'Agreement reviewed.'
                      : 'Please scroll through the entire agreement to continue.'}
                  </p>
                </div>

                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-brand-text mb-2">
                    Sign Agreement
                  </h2>
                  <Input
                    label="Typed Full Name"
                    value={form.signedName}
                    onChange={(e) => updateForm('signedName', e.target.value)}
                    error={errors.signedName}
                    placeholder="Type your full legal name"
                  />
                  <SignaturePad
                    onChange={(dataUrl) =>
                      updateForm('signatureDataUrl', dataUrl)
                    }
                  />
                  {errors.signatureDataUrl && (
                    <p className="text-xs text-brand-red">
                      {errors.signatureDataUrl}
                    </p>
                  )}
                  <p className="text-xs text-brand-muted">
                    Date: {new Date().toLocaleDateString()}
                  </p>

                  <label className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      checked={form.agreedToTerms}
                      onChange={(e) =>
                        updateForm('agreedToTerms', e.target.checked)
                      }
                      className="w-4 h-4 accent-brand-accent mt-0.5"
                    />
                    <span className="text-sm text-brand-text">
                      I have read and agree to the Equipment Rental Agreement
                      terms and conditions.
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-xs text-brand-red">
                      {errors.agreedToTerms}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========== Checkout ========== */}
            {stepName === 'Checkout' && (
              <div className="space-y-6">
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Order Summary
                  </h2>
                  <div className="divide-y divide-brand-border">
                    {cart.map((item) => (
                      <div
                        key={item.equipmentId}
                        className="flex justify-between py-3"
                      >
                        <div>
                          <p className="text-sm text-brand-text">{item.name}</p>
                          <p className="text-xs text-brand-muted">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-brand-text">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4 border-t border-brand-border mt-2">
                    <span className="text-base font-semibold text-brand-text">
                      Total
                    </span>
                    <span className="text-base font-semibold text-brand-accent">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  {!form.hasInsurance && (
                    <p className="text-xs text-brand-muted mt-3">
                      + $500.00 security hold (authorized, not captured)
                    </p>
                  )}
                </div>

                {/* Booking summary */}
                <div className="bg-white border border-brand-border shadow-sm rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-text mb-4">
                    Booking Details
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-brand-muted">Type</dt>
                    <dd className="text-brand-text">{isInStudio ? 'In-Studio' : 'Equipment Only'}</dd>
                    <dt className="text-brand-muted">Start</dt>
                    <dd className="text-brand-text">{form.rentalDate} at {form.startTime}</dd>
                    <dt className="text-brand-muted">End</dt>
                    <dd className="text-brand-text">{form.endDate} at {form.endTime}</dd>
                    <dt className="text-brand-muted">Renter</dt>
                    <dd className="text-brand-text">{form.renterName}</dd>
                    <dt className="text-brand-muted">Email</dt>
                    <dd className="text-brand-text">{form.email}</dd>
                    {isInStudio && form.productionType && (
                      <>
                        <dt className="text-brand-muted">Production</dt>
                        <dd className="text-brand-text">
                          {PRODUCTION_TYPES.find(
                            (t) => t.value === form.productionType,
                          )?.label || form.productionType}
                        </dd>
                      </>
                    )}
                    <dt className="text-brand-muted">Insurance</dt>
                    <dd className="text-brand-text">
                      {form.hasInsurance
                        ? form.insuranceProvider
                        : 'No — $500 hold applies'}
                    </dd>
                  </dl>
                </div>

                {errors.checkout && (
                  <div className="p-4 rounded-md bg-brand-red/10 border border-brand-red/30">
                    <p className="text-sm text-brand-red">{errors.checkout}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={goPrev}
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    loading={submitting}
                    onClick={handleCheckout}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            {!isCheckoutStep && (
              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button onClick={goNext}>Next</Button>
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          {!isCheckoutStep && (
            <div className="lg:w-72 shrink-0">
              <div className="sticky top-20 bg-white border border-brand-border shadow-sm rounded-lg p-5">
                <h3 className="text-sm font-semibold text-brand-text mb-3">
                  Cart
                </h3>
                {cart.length === 0 ? (
                  <p className="text-xs text-brand-muted">No items yet.</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.equipmentId}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-brand-muted truncate mr-2">
                          {item.name}
                        </span>
                        <span className="text-brand-text shrink-0">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-brand-border flex justify-between text-sm font-semibold">
                      <span className="text-brand-text">Total</span>
                      <span className="text-brand-accent">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
