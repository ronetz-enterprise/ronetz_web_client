import type { Metadata } from "next";

import { Amount } from "@/components/amount";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DialogDemo, MenuDemo, ToastDemo } from "./demos";
import { Caption, Row, Specimen } from "./specimen";
import { ThemeSwitch } from "./theme-switch";

export const metadata: Metadata = { title: "Système de design" };

const colors = [
  ["Fond", "bg-background", "Page"],
  ["Surface", "bg-surface", "Fonds secondaires"],
  ["Carte", "bg-card", "Cartes"],
  ["Texte", "bg-foreground", "Encre"],
  ["Texte discret", "bg-muted-foreground", "Ardoise"],
  ["Trait", "bg-border", "Brume"],
  ["Action", "bg-primary", "Émeraude / Signal"],
  ["Menthe", "bg-accent", "Sélection"],
  ["Forêt", "bg-forest", "Bandeaux"],
  ["Succès", "bg-success", "En ligne"],
  ["Attention", "bg-warning", "Expire bientôt"],
  ["Erreur", "bg-danger", "Hors ligne"],
] as const;

const routers = [
  {
    name: "Hall d’entrée",
    site: "Akwa",
    state: "ok",
    active: 42,
    revenue: 186000,
  },
  { name: "Terrasse", site: "Akwa", state: "warn", active: 9, revenue: 31500 },
  {
    name: "Salle 2",
    site: "Bonapriso",
    state: "off",
    active: 0,
    revenue: 74000,
  },
] as const;

function State({ state }: { state: "ok" | "warn" | "off" }) {
  const cfg = {
    ok: {
      label: "En ligne",
      level: 3,
      cls: "bg-success text-success-foreground border-success-border",
    },
    warn: {
      label: "Signal faible",
      level: 1,
      cls: "bg-warning text-warning-foreground border-warning-border",
    },
    off: {
      label: "Hors ligne",
      level: 0,
      cls: "bg-danger text-danger-foreground border-danger-border",
    },
  } as const;
  const c = cfg[state];
  return (
    <Badge variant="outline" className={`${c.cls} gap-1.5 pl-1.5`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {c.label}
    </Badge>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Système de design · Édition 2 · shadcn
        </span>
        <ThemeSwitch />
      </div>
      <PageHeader
        title="Composants Ronetz"
        description="Les vrais composants shadcn (style Vega, sur Base UI), habillés avec les jetons de la charte. Chaque exemple s’affiche en clair puis en sombre."
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Couleurs</h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Toutes les couleurs viennent de globals.css. Les composants
          n’utilisent que ces noms.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map(([label, cls, role]) => (
            <div key={label} className="flex flex-col gap-2">
              <div className={`h-16 rounded-lg border border-border ${cls}`} />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Specimen title="Boutons">
        <div className="flex flex-col gap-4">
          <div>
            <Caption>Variantes</Caption>
            <Row>
              <Button>Créer des accès</Button>
              <Button variant="secondary">Exporter</Button>
              <Button variant="outline">Annuler</Button>
              <Button variant="ghost">Plus tard</Button>
              <Button variant="destructive">Retirer le routeur</Button>
              <Button variant="link">Voir le détail</Button>
            </Row>
          </div>
          <div>
            <Caption>Tailles</Caption>
            <Row>
              <Button size="sm">Petit</Button>
              <Button>Normal</Button>
              <Button size="lg">Grand</Button>
            </Row>
          </div>
          <div>
            <Caption>États</Caption>
            <Row>
              <Button disabled>Désactivé</Button>
            </Row>
          </div>
        </div>
      </Specimen>

      <Specimen title="Champs">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="f-price">Prix de l’offre</FieldLabel>
            <Input id="f-price" defaultValue="500" inputMode="numeric" />
            <FieldDescription>
              Ce que paie le client pour 24 h de connexion, en FCFA.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="f-site">Site</FieldLabel>
            <Select defaultValue="akwa">
              <SelectTrigger id="f-site" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="akwa">Cyber Akwa</SelectItem>
                <SelectItem value="bona">Bonapriso</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="f-sms" defaultChecked />
            <FieldLabel htmlFor="f-sms">Envoyer le code par SMS</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch id="f-alert" defaultChecked />
            <FieldLabel htmlFor="f-alert">
              Me prévenir si un routeur ne répond plus
            </FieldLabel>
          </Field>
        </FieldGroup>
      </Specimen>

      <Specimen title="États et alertes">
        <div className="flex flex-col gap-4">
          <Row>
            <State state="ok" />
            <State state="warn" />
            <State state="off" />
            <Badge variant="secondary">Désactivé</Badge>
          </Row>
          <Alert>
            <AlertTitle>
              Le routeur Terrasse ne répond plus depuis 14 h 05
            </AlertTitle>
            <AlertDescription>
              Vérifiez qu’il est allumé et branché. Vos clients ne peuvent plus
              se connecter sur ce point.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Paiement non reçu</AlertTitle>
            <AlertDescription>
              Le client n’a pas validé sur son téléphone. Aucun accès n’a été
              créé.
            </AlertDescription>
          </Alert>
        </div>
      </Specimen>

      <Specimen
        title="Tableau"
        stack
        description="Sur ordinateur, un tableau. Sur téléphone, chaque ligne devient une carte (voir le gabarit de liste)."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Routeur</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Accès actifs</TableHead>
              <TableHead className="text-right">Recettes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routers.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.site}</TableCell>
                <TableCell>
                  <State state={r.state} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.active}
                </TableCell>
                <TableCell className="text-right">
                  <Amount value={r.revenue} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">Données d’exemple.</p>
      </Specimen>

      <Specimen title="Cartes et chiffres">
        <Card>
          <CardHeader>
            <CardDescription>Recettes de novembre</CardDescription>
            <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
              <Amount value={1248500} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-success-foreground">
              + 12 % sur octobre
            </p>
          </CardContent>
        </Card>
      </Specimen>

      <Specimen title="Onglets, navigation et pagination" stack>
        <div className="flex flex-col gap-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Offres</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>24 heures</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Tabs defaultValue="apercu">
            <TabsList>
              <TabsTrigger value="apercu">Aperçu</TabsTrigger>
              <TabsTrigger value="prix">Prix et accès</TabsTrigger>
              <TabsTrigger value="pres">Présentation</TabsTrigger>
            </TabsList>
            <TabsContent
              value="apercu"
              className="pt-3 text-sm text-muted-foreground"
            >
              Durée, prix et nombre de ventes de cette offre.
            </TabsContent>
            <TabsContent
              value="prix"
              className="pt-3 text-sm text-muted-foreground"
            >
              Prix, durée et appareils autorisés.
            </TabsContent>
            <TabsContent
              value="pres"
              className="pt-3 text-sm text-muted-foreground"
            >
              Ce que voit le client sur la page d’achat.
            </TabsContent>
          </Tabs>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Specimen>

      <Specimen title="Fenêtre, menu et messages">
        <div className="flex flex-col gap-4">
          <Row>
            <DialogDemo />
            <MenuDemo />
          </Row>
          <ToastDemo />
        </div>
      </Specimen>

      <Specimen title="Chargement et vide">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Aucun accès pour l’instant</EmptyTitle>
              <EmptyDescription>
                Les accès apparaissent ici dès qu’un client en achète un sur
                votre portail, ou quand vous en créez un vous-même.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>Créer un accès</Button>
            </EmptyContent>
          </Empty>
        </div>
      </Specimen>
    </main>
  );
}
