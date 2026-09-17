import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Package, Star, AlertCircle, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useListProducts } from "@workspace/api-client-react";

export default function Products() {
  const [search, setSearch] = useState("");
  
  const queryParams = { 
    ...(search ? { q: search } : {})
  };
  
  const productsQuery = useListProducts(queryParams);
  const products = (productsQuery.data || []).filter((product) => product.type === "digital");

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          
          <div className="max-w-3xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Digital Products</h1>
            <p className="text-muted-foreground text-lg">
              Download premium templates, ebooks, kits, and tools to accelerate your workflow.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search for products..." 
                className="pl-10 h-12 bg-card border-border text-foreground rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {productsQuery.isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : productsQuery.isError ? (
            <div className="text-center py-20 bg-destructive/10 rounded-3xl border border-destructive/20 text-destructive">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error loading products</h3>
              <p>Please try again later.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any products matching your current filters. Try adjusting your search terms.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-border"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group cursor-pointer flex flex-col h-full shadow-sm">
                    <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                      <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border-border text-foreground font-medium uppercase text-[10px] tracking-wider">
                        {product.type}
                      </Badge>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="font-bold text-lg text-foreground">
                          ${(product.priceMinor / 100).toFixed(2)} {product.currency.toUpperCase()}
                        </span>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </PublicLayout>
  );
}
