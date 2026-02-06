'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, Mail, Phone, MapPin, Globe, Tag } from "lucide-react";
import { Supplier } from '../services/supplierService';

interface SupplierViewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export function SupplierViewModal({
  isOpen,
  onOpenChange,
  supplier
}: SupplierViewModalProps) {
  if (!supplier) return null;

  const formatAddress = (address: Supplier['address']) => {
    const parts = [
      address.street,
      address.block_lot,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Supplier Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Basic Information
            </h3>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-sm">
                {supplier.name}
              </p>
            </div>

            {supplier.description && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">
                  {supplier.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <p className="text-sm">{supplier.email}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </label>
                <p className="text-sm">{supplier.phone_number}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Branch & Category Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Branch & Category Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Branch Name</label>
                <Badge variant="secondary">
                  {supplier.branch?.name || 'No branch assigned'}
                </Badge>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Supplier Category</label>
                <Badge variant="outline">
                  {supplier.supplier_category?.name || 'No category assigned'}
                </Badge>
              </div>
            </div>

            {supplier.branch && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Branch Email</label>
                  <p className="text-sm">{supplier.branch.email}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Branch Contact</label>
                  <p className="text-sm">{supplier.branch.contact_no}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Full Address
                </label>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {formatAddress(supplier.address)}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <p className="text-sm">{supplier.address.country}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <p className="text-sm">{supplier.address.region}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Province</label>
                  <p className="text-sm">{supplier.address.province}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="text-sm">{supplier.address.city}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Barangay</label>
                  <p className="text-sm">
                    {supplier.address.barangay || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Block/Lot</label>
                  <p className="text-sm">
                    {supplier.address.block_lot || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Street</label>
                  <p className="text-sm">
                    {supplier.address.street || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Postal Code</label>
                  <p className="text-sm">
                    {supplier.address.postal_code || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}