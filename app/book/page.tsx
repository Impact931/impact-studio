'use client';

import { useState, useMemo, useRef } from 'react';
import {
  STUDIO_RENTALS,
  LIGHTING_BUNDLES,
  ALACARTE_EQUIPMENT,
  ADDONS,
  formatPrice,
} from '@/content/equipment-catalog';
import { RENTAL_AGREEMENT } from '@/content/rental-agreement';
import { BookingFormData, CartItem, EquipmentItem } from '@/types/booking';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SignaturePad from '@/components/booking/SignaturePad';

const STEPS = [
  'Equipment Selection',
  'Booking Details',
  'Insurance',
  'Review & Sign',
  'Checkout',
] as const;

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

const CONTENT_DISCLOSURES = [
  { value: 'partial-nudity', label: 'Partial nudity' },
  { value: 'full-nudity', label: 'Full nudity' },
  { value: 'sensitive-content', label: 'Sensitive content' },
];

const STUDIO_RENTAL_MAP: Record<string, string> = {
  hourly: 'studio-hourly',
  half_day: 'studio-half-day',
  full_day: 'studio-full-day',
};

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(0);
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
    startTime: '',
    endTime: '',
    studioRentalType: 'hourly',
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

  // --- Equipment selection state (separate from cart for UI) ---
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());
  const [selectedAlacarte, setSelectedAlacarte] = useState<Set<string>>(new Set());

  // --- Build cart from selections ---
  const cart = useMemo(() => {
    const items: CartItem[] = [];
    const isInStudio = form.rentalMode === 'in_studio';

    // Studio rental
    const studioId = STUDIO_RENTAL_MAP[form.studioRentalType];
    const studioItem = STUDIO_RENTALS.find((r) => r.id === studioId);
    if (studioItem) {
      const price = isInStudio
        ? studioItem.priceInStudio
        : studioItem.priceOutOfStudio;
      if (price > 0) {
        items.push({
          equipmentId: studioItem.id,
          name: studioItem.name,
          price,
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

    // A la carte
    selectedAlacarte.forEach((id) => {
      const item = ALACARTE_EQUIPMENT.find((a) => a.id === id);
      if (item) {
        const price = isInStudio ? item.priceInStudio : item.priceOutOfStudio;
        if (price > 0) {
          items.push({
            equipmentId: item.id,
            name: item.name,
            price,
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

    if (step === 0) {
      // Must have at least a studio rental in cart
      if (form.rentalMode === 'in_studio' && cart.length === 0) {
        errs.studioRentalType = 'Please select a studio rental option';
      }
    }

    if (step === 1) {
      if (!form.rentalDate) errs.rentalDate = 'Date is required';
      if (!form.startTime) errs.startTime = 'Start time is required';
      if (!form.endTime) errs.endTime = 'End time is required';
      if (!form.renterName.trim()) errs.renterName = 'Name is required';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = 'Valid email is required';
      if (!form.productionType) errs.productionType = 'Production type is required';
    }

    if (step === 2) {
      if (form.hasInsurance && !form.insuranceProvider.trim()) {
        errs.insuranceProvider = 'Insurance provider is required';
      }
    }

    if (step === 3) {
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

  // --- Render helpers for equipment items ---
  const renderEquipmentCheckbox = (
    item: EquipmentItem,
    checked: boolean,
    onToggle: () => void,
  ) => {
    const isInStudio = form.rentalMode === 'in_studio';
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
              <p className="text-xs text-brand-muted">{item.description}</p>
            )}
          </div>
        </div>
        <span className="text-sm font-medium text-brand-accent">
          {included ? 'Included' : formatPrice(price)}
        </span>
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-text">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <h1 className="text-3xl font-display font-bold text-brand-white mb-2">
          Book Impact Studio
        </h1>
        <p className="text-brand-muted mb-8">
          Reserve equipment and studio time in just a few steps.
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
                      ? 'bg-brand-accent text-brand-black'
                      : idx < currentStep
                        ? 'bg-brand-accent-dim text-brand-black'
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
            {/* ========== STEP 1: Equipment Selection ========== */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Rental Mode Toggle */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
                    Rental Location
                  </h2>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateForm('rentalMode', 'in_studio')}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        form.rentalMode === 'in_studio'
                          ? 'bg-brand-accent text-brand-black'
                          : 'bg-brand-border text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      In-Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => updateForm('rentalMode', 'out_of_studio')}
                      className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                        form.rentalMode === 'out_of_studio'
                          ? 'bg-brand-accent text-brand-black'
                          : 'bg-brand-border text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      Out-of-Studio
                    </button>
                  </div>
                </div>

                {/* Studio Rental Type (in-studio only) */}
                {form.rentalMode === 'in_studio' && (
                  <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                    <h2 className="text-lg font-semibold text-brand-white mb-4">
                      Studio Rental
                    </h2>
                    {errors.studioRentalType && (
                      <p className="text-xs text-brand-red mb-2">
                        {errors.studioRentalType}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {STUDIO_RENTALS.map((rental) => (
                        <label
                          key={rental.id}
                          className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                            STUDIO_RENTAL_MAP[form.studioRentalType] === rental.id
                              ? 'border-brand-accent bg-brand-accent/10'
                              : 'border-brand-border hover:border-brand-accent/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="studioRental"
                              checked={
                                STUDIO_RENTAL_MAP[form.studioRentalType] ===
                                rental.id
                              }
                              onChange={() => {
                                const type = Object.entries(STUDIO_RENTAL_MAP).find(
                                  ([, v]) => v === rental.id,
                                )?.[0] as BookingFormData['studioRentalType'];
                                if (type) updateForm('studioRentalType', type);
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Lighting Bundles */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
                    A La Carte Equipment
                  </h2>
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
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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

            {/* ========== STEP 2: Booking Details ========== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Date & Time */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
                    Date &amp; Time
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      value={form.rentalDate}
                      onChange={(e) => updateForm('rentalDate', e.target.value)}
                      error={errors.rentalDate}
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
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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

                {/* Production Details */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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
                        className="w-full px-3 py-2 rounded-md text-sm bg-brand-card border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
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
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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

                {/* Content Disclosure */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
                    Content Disclosure
                  </h2>
                  <p className="text-xs text-brand-muted mb-3">
                    Please disclose if your production involves any of the
                    following:
                  </p>
                  <div className="space-y-2">
                    {CONTENT_DISCLOSURES.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-3 p-2"
                      >
                        <input
                          type="checkbox"
                          checked={form.contentDisclosure.includes(item.value)}
                          onChange={() =>
                            toggleArrayItem('contentDisclosure', item.value)
                          }
                          className="w-4 h-4 accent-brand-accent"
                        />
                        <span className="text-sm text-brand-text">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Off-site equipment */}
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.offSiteEquipment}
                      onChange={(e) =>
                        updateForm('offSiteEquipment', e.target.checked)
                      }
                      className="w-4 h-4 accent-brand-accent"
                    />
                    <span className="text-sm text-brand-text">
                      I will be taking rented equipment off-site
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ========== STEP 3: Insurance ========== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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
                          ? 'bg-brand-accent text-brand-black'
                          : 'bg-brand-border text-brand-muted hover:text-brand-text'
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
                          ? 'bg-brand-accent text-brand-black'
                          : 'bg-brand-border text-brand-muted hover:text-brand-text'
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

            {/* ========== STEP 4: Review & Sign ========== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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
                    className="h-64 overflow-y-auto p-4 rounded-md bg-brand-black border border-brand-border text-xs text-brand-muted whitespace-pre-wrap leading-relaxed"
                  >
                    {RENTAL_AGREEMENT}
                  </div>
                  <p className="text-xs text-brand-muted mt-2">
                    {hasScrolledAgreement
                      ? 'Agreement reviewed.'
                      : 'Please scroll through the entire agreement to continue.'}
                  </p>
                </div>

                <div className="bg-brand-card border border-brand-border rounded-lg p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-brand-white mb-2">
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

            {/* ========== STEP 5: Checkout ========== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
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
                    <span className="text-base font-semibold text-brand-white">
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
                <div className="bg-brand-card border border-brand-border rounded-lg p-5">
                  <h2 className="text-lg font-semibold text-brand-white mb-4">
                    Booking Details
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-brand-muted">Date</dt>
                    <dd className="text-brand-text">{form.rentalDate}</dd>
                    <dt className="text-brand-muted">Time</dt>
                    <dd className="text-brand-text">
                      {form.startTime} &ndash; {form.endTime}
                    </dd>
                    <dt className="text-brand-muted">Renter</dt>
                    <dd className="text-brand-text">{form.renterName}</dd>
                    <dt className="text-brand-muted">Email</dt>
                    <dd className="text-brand-text">{form.email}</dd>
                    <dt className="text-brand-muted">Production</dt>
                    <dd className="text-brand-text">
                      {PRODUCTION_TYPES.find(
                        (t) => t.value === form.productionType,
                      )?.label || form.productionType}
                    </dd>
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

                <Button
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  onClick={handleCheckout}
                >
                  Proceed to Payment
                </Button>
              </div>
            )}

            {/* Navigation */}
            {currentStep < 4 && (
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

          {/* Cart sidebar (steps 0-3) */}
          {currentStep < 4 && (
            <div className="lg:w-72 shrink-0">
              <div className="sticky top-8 bg-brand-card border border-brand-border rounded-lg p-5">
                <h3 className="text-sm font-semibold text-brand-white mb-3">
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
                      <span className="text-brand-white">Total</span>
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
