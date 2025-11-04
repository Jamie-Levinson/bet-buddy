"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface BetFormProps {
  onSubmit: (data: BetFormData) => Promise<void>;
  defaultValues?: Partial<BetFormData>;
}

export function BetForm({ onSubmit, defaultValues }: BetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BetFormData>({
    resolver: zodResolver(betFormSchema) as any,
    defaultValues: {
      betType: "straight",
      result: "win",
      isBonusBet: false,
      isNoSweat: false,
      legs: [{ description: "", eventName: "", odds: 0, result: "win" }],
      date: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "legs",
  });

  const betType = watch("betType");

  const onFormSubmit = async (data: BetFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bet Details</CardTitle>
          <CardDescription>Enter the basic information about your bet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="betType">Bet Type</Label>
            <Select
              value={watch("betType")}
              onValueChange={(value) => setValue("betType", value as BetFormData["betType"])}
            >
              <SelectTrigger id="betType">
                <SelectValue placeholder="Select bet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="same_game_parlay">Same Game Parlay</SelectItem>
                <SelectItem value="parlay">Parlay</SelectItem>
              </SelectContent>
            </Select>
            {errors.betType && <p className="text-sm text-destructive">{errors.betType.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="wager">Wager ($)</Label>
              <Input id="wager" type="number" step="0.01" {...register("wager")} />
              {errors.wager && <p className="text-sm text-destructive">{errors.wager.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout">Payout ($)</Label>
              <Input id="payout" type="number" step="0.01" {...register("payout")} />
              {errors.payout && <p className="text-sm text-destructive">{errors.payout.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="odds">Odds</Label>
              <Input id="odds" type="number" step="0.01" {...register("odds")} />
              {errors.odds && <p className="text-sm text-destructive">{errors.odds.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select
                value={watch("result")}
                onValueChange={(value) => setValue("result", value as BetFormData["result"])}
              >
                <SelectTrigger id="result">
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
              {errors.result && <p className="text-sm text-destructive">{errors.result.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legs</CardTitle>
          <CardDescription>
            {betType === "straight"
              ? "Enter the single leg for this straight bet"
              : betType === "same_game_parlay"
                ? "Enter all legs from the same game"
                : "Enter all legs from different events"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Leg {index + 1}</h3>
                {fields.length > 1 && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`legs.${index}.description`}>Description</Label>
                <Textarea
                  id={`legs.${index}.description`}
                  placeholder="e.g., Lakers -5.5"
                  {...register(`legs.${index}.description`)}
                />
                {errors.legs?.[index]?.description && (
                  <p className="text-sm text-destructive">{errors.legs[index]?.description?.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`legs.${index}.eventName`}>Event Name</Label>
                  <Input id={`legs.${index}.eventName`} {...register(`legs.${index}.eventName`)} />
                  {errors.legs?.[index]?.eventName && (
                    <p className="text-sm text-destructive">{errors.legs[index]?.eventName?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`legs.${index}.odds`}>Odds</Label>
                  <Input
                    id={`legs.${index}.odds`}
                    type="number"
                    step="0.01"
                    {...register(`legs.${index}.odds`)}
                  />
                  {errors.legs?.[index]?.odds && (
                    <p className="text-sm text-destructive">{errors.legs[index]?.odds?.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`legs.${index}.result`}>Result</Label>
                <Select
                  value={watch(`legs.${index}.result`)}
                  onValueChange={(value) =>
                    setValue(`legs.${index}.result`, value as "win" | "loss" | "void", { shouldValidate: true })
                  }
                >
                  <SelectTrigger id={`legs.${index}.result`}>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
                {errors.legs?.[index]?.result && (
                  <p className="text-sm text-destructive">{errors.legs[index]?.result?.message}</p>
                )}
              </div>
            </div>
          ))}

          {betType !== "straight" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ description: "", eventName: "", odds: 0, result: "win" })}
            >
              Add Leg
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
          <CardDescription>Additional bet characteristics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBonusBet"
              checked={watch("isBonusBet")}
              onCheckedChange={(checked) => setValue("isBonusBet", checked === true)}
            />
            <Label htmlFor="isBonusBet" className="cursor-pointer">
              Bonus Bet (placed with credits)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boostPercentage">Boost Percentage</Label>
            <Input
              id="boostPercentage"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="25, 30, 50, etc."
              {...register("boostPercentage")}
            />
            {errors.boostPercentage && (
              <p className="text-sm text-destructive">{errors.boostPercentage.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNoSweat"
              checked={watch("isNoSweat")}
              onCheckedChange={(checked) => setValue("isNoSweat", checked === true)}
            />
            <Label htmlFor="isNoSweat" className="cursor-pointer">
              No Sweat (refund as bonus if loses)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Bet"}
        </Button>
      </div>
    </form>
  );
}

