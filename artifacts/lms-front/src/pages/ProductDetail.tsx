import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetProduct } from "@workspace/api-client-react";
import { CheckCircle2, AlertCircle, Download, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProductDetail() {
  const params = useParams();
  const productId = params.productId ? parseInt(params.productId) : 0;
  
  const { data: product, isLoading, isError } = useGetProduct(productId, { 
    query: { enabled: !!productId, queryKey: ['getProduct', productId] } 
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background pt-32 pb-20 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground">
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Product Visual */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-card border border-border shadow-sm flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
                <FileText className="w-32 h-32 text-muted-foreground/30" />
                <Badge className="absolute top-6 left-6 bg-background/80 backdrop-blur-md border-border text-foreground uppercase tracking-wider text-xs px-3 py-1">
                  {product.type}
                </Badge>
              </div>
              
              {/* Product Info */}
              <div className="space-y-8 flex flex-col justify-center">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    {product.title}
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
                
                <div className="p-6 bg-card border border-border rounded-2xl space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">
                      ${(product.priceMinor / 100).toFixed(2)} {product.currency.toUpperCase()}
                    </span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      In Stock
                    </Badge>
                  </div>
                  
                  <ul className="space-y-3 pt-4 border-t border-border">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Download className="w-5 h-5 text-primary" />
                      <span>Instant digital download</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>Lifetime updates included</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>Commercial use license</span>
                    </li>
                  </ul>
                  
                  <div className="pt-2">
                    <Link href="/checkout">
                      <Button size="lg" className="w-full h-14 text-lg" data-testid="button-purchase">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Purchase Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
