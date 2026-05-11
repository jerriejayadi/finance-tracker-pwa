"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cropImage } from "@/lib/crop-image";
import { ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropDrawerProps {
  open: boolean;
  imageSrc: string | null;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropDrawer({
  open,
  imageSrc,
  onCrop,
  onCancel,
}: AvatarCropDrawerProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const onCropComplete = React.useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );

  const handleDone = async () => {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const blob = await cropImage(imageSrc, croppedArea);
      onCrop(blob);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
      // Reset state for next use
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between px-5 pb-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="text-[13px] font-medium text-fg-2 hover:text-fg-0 cursor-pointer"
          >
            Cancel
          </button>
          <DrawerTitle>Crop Photo</DrawerTitle>
          <DrawerDescription className="sr-only">
            Adjust your profile photo
          </DrawerDescription>
          <button
            type="button"
            onClick={handleDone}
            disabled={processing}
            className="text-[13px] font-medium text-brand hover:text-brand-hi disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Cropping..." : "Done"}
          </button>
        </DrawerHeader>

        {/* Crop area */}
        <div className="relative flex-1 mx-5 mt-4 mb-4 overflow-hidden rounded-lg bg-bg-0">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              minZoom={1}
              maxZoom={3}
              style={{
                containerStyle: {
                  borderRadius: "10px",
                },
              }}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-8 pb-8">
          <ZoomOut size={16} className="text-fg-2 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-bg-3 rounded-full outline-none accent-brand cursor-pointer"
          />
          <ZoomIn size={16} className="text-fg-2 flex-shrink-0" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
