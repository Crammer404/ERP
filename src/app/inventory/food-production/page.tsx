'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat } from 'lucide-react';
import { IngredientsPage } from './ingredient/page';
import { RecipesPage } from './recipe/page';

export default function FoodProductionPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <ChefHat className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Food Production</h1>
          <p className="text-sm text-muted-foreground">
            Manage ingredients and recipes used for food and beverage preparation.
          </p>
        </div>
      </div>

      <Tabs defaultValue="ingredients" className="space-y-6">
        <Card className="bg-transparent border-none shadow-none">
          <CardContent className="pt-6 pb-0">
            <TabsList className="w-full inline-flex">
              <TabsTrigger value="ingredients" className="flex-1">Ingredients</TabsTrigger>
              <TabsTrigger value="recipes" className="flex-1">Recipes</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="ingredients">
          <IngredientsPage />
        </TabsContent>

        <TabsContent value="recipes">
          <RecipesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
