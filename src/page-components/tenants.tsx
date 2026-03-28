// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useTenantRouter } from "@/hooks/use-tenant-router";
import { useGetAuthUserQuery, useGetTenantsQuery, useCreateTenantMutation, useDeleteTenantMutation, useUpdateTenantMutation } from "@/store/api";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, Trash2, Building2, Globe, Calendar, Users, Loader2, Settings, Pencil, AlertTriangle } from "lucide-react";

export default function TenantsPage() {
  const router = useTenantRouter();
  const { toast } = useToast();
  const { data: user, isLoading: authLoading } = useGetAuthUserQuery();
  const { data: tenants = [], isLoading: tenantsLoading } = useGetTenantsQuery(undefined, {
    skip: !user?.isSuperAdmin,
  });
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [deleteTenant] = useDeleteTenantMutation();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", domainName: "", subDomain: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [formData, setFormData] = useState({
    name: "",
    domainName: "",
    subDomain: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-tenants">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="access-denied">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
            <Button className="mt-4" onClick={() => router.push("/")} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      await createTenant(formData).unwrap();
      toast({ title: "Tenant created", description: `${formData.name} has been created with a super admin user.` });
      setShowCreateDialog(false);
      setFormData({ name: "", domainName: "", subDomain: "", adminEmail: "", adminPassword: "", adminName: "" });
    } catch (error: any) {
      toast({
        title: "Error creating tenant",
        description: error?.data?.error || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const [deletingTenant, setDeletingTenant] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingTenant || deleteConfirmText !== deletingTenant.name) return;
    setIsDeleting(true);
    try {
      await deleteTenant(deletingTenant.id).unwrap();
      toast({ title: "Tenant deleted", description: `${deletingTenant.name} has been permanently removed.` });
      setDeletingTenant(null);
      setDeleteConfirmText("");
    } catch (error: any) {
      toast({
        title: "Error deleting tenant",
        description: error?.data?.error || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (tenant: any) => {
    setEditingTenant(tenant);
    setEditLoading(true);
    try {
      const res = await api.get(`/api/tenants/${tenant.id}`);
      const data = res.data;
      setEditFormData({
        name: data.name || "",
        domainName: data.domainName || "",
        subDomain: data.subDomain || "",
        adminName: data.adminName || "",
        adminEmail: data.adminEmail || "",
        adminPassword: "",
      });
    } catch {
      setEditFormData({
        name: tenant.name || "",
        domainName: tenant.domainName || "",
        subDomain: tenant.subDomain || "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTenant) return;
    try {
      const payload: any = {
        name: editFormData.name,
        domainName: editFormData.domainName || null,
        subDomain: editFormData.subDomain || null,
        adminName: editFormData.adminName,
        adminEmail: editFormData.adminEmail,
      };
      if (editFormData.adminPassword) {
        payload.adminPassword = editFormData.adminPassword;
      }
      await updateTenant({ id: editingTenant.id, data: payload }).unwrap();
      toast({ title: "Tenant updated", description: `${editFormData.name} has been updated.` });
      setEditingTenant(null);
    } catch (error: any) {
      toast({
        title: "Error updating tenant",
        description: error?.data?.error || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const getViewUrl = (tenant: any) => {
    return `/?_tenantId=${tenant.id}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-tenants-title">Tenant Management</h1>
            <p className="text-muted-foreground mt-1">Manage platform tenants and their configurations</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-tenant">
                <Plus className="h-4 w-4 mr-2" />
                New Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Golf Club Wales"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-tenant-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainName">Domain Name (optional)</Label>
                  <Input
                    id="domainName"
                    placeholder="e.g. golfclubwales.com"
                    value={formData.domainName}
                    onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                    data-testid="input-tenant-domain"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subDomain">Subdomain (optional)</Label>
                  <Input
                    id="subDomain"
                    placeholder="e.g. wales.golfjunkies.com"
                    value={formData.subDomain}
                    onChange={(e) => setFormData({ ...formData, subDomain: e.target.value })}
                    data-testid="input-tenant-subdomain"
                  />
                </div>
                <hr className="my-2" />
                <p className="text-sm text-muted-foreground font-medium">Super Admin for this Tenant</p>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    placeholder="e.g. John Smith"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    data-testid="input-tenant-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="e.g. admin@golfclubwales.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    data-testid="input-tenant-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    data-testid="input-tenant-admin-password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-tenant">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !formData.name || !formData.adminEmail || !formData.adminPassword || !formData.adminName}
                  data-testid="button-submit-tenant"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Tenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {tenantsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
              <p className="text-muted-foreground mb-4">Create your first tenant to get started with multi-tenancy.</p>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-tenant">
                <Plus className="h-4 w-4 mr-2" />
                Create First Tenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tenants.map((tenant: any) => {
              const viewUrl = getViewUrl(tenant);
              return (
                <Card key={tenant.id} data-testid={`card-tenant-${tenant.id}`}>
                  <CardContent className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`text-tenant-name-${tenant.id}`}>
                          {tenant.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {tenant.domainName && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {tenant.domainName}
                            </span>
                          )}
                          {tenant.subDomain && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {tenant.subDomain}
                            </span>
                          )}
                          {tenant.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(tenant.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(viewUrl, "_blank")}
                          data-testid={`button-view-tenant-${tenant.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                        data-testid={`button-edit-tenant-${tenant.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin?_tenantId=${tenant.id}`, "_blank")}
                        data-testid={`button-admin-tenant-${tenant.id}`}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setDeletingTenant({ id: tenant.id, name: tenant.name }); setDeleteConfirmText(""); }}
                        data-testid={`button-delete-tenant-${tenant.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
            </DialogHeader>
            {editLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tenant URL</Label>
                  <Input
                    readOnly
                    value={`${window.location.origin}/?_tenantId=${editingTenant?.id || ""}`}
                    className="bg-muted text-muted-foreground cursor-default"
                    data-testid="input-edit-tenant-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tenant Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g. Golf Club Wales"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    data-testid="input-edit-tenant-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-domainName">Domain Name (optional)</Label>
                  <Input
                    id="edit-domainName"
                    placeholder="e.g. golfclubwales.com"
                    value={editFormData.domainName}
                    onChange={(e) => setEditFormData({ ...editFormData, domainName: e.target.value })}
                    data-testid="input-edit-tenant-domain"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subDomain">Subdomain (optional)</Label>
                  <Input
                    id="edit-subDomain"
                    placeholder="e.g. wales.golfjunkies.com"
                    value={editFormData.subDomain}
                    onChange={(e) => setEditFormData({ ...editFormData, subDomain: e.target.value })}
                    data-testid="input-edit-tenant-subdomain"
                  />
                </div>
                <hr className="my-2" />
                <p className="text-sm text-muted-foreground font-medium">Tenant Admin</p>
                <div className="space-y-2">
                  <Label htmlFor="edit-adminName">Admin Name</Label>
                  <Input
                    id="edit-adminName"
                    placeholder="e.g. John Smith"
                    value={editFormData.adminName}
                    onChange={(e) => setEditFormData({ ...editFormData, adminName: e.target.value })}
                    data-testid="input-edit-tenant-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-adminEmail">Admin Email</Label>
                  <Input
                    id="edit-adminEmail"
                    type="email"
                    placeholder="e.g. admin@golfclubwales.com"
                    value={editFormData.adminEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, adminEmail: e.target.value })}
                    data-testid="input-edit-tenant-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-adminPassword">Admin Password</Label>
                  <Input
                    id="edit-adminPassword"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editFormData.adminPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, adminPassword: e.target.value })}
                    data-testid="input-edit-tenant-admin-password"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTenant(null)} data-testid="button-cancel-edit-tenant">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || editLoading || !editFormData.name}
                data-testid="button-submit-edit-tenant"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingTenant} onOpenChange={(open) => { if (!open) { setDeletingTenant(null); setDeleteConfirmText(""); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Tenant
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <p className="text-sm font-medium">This action is permanent and cannot be undone.</p>
                <p className="text-sm text-muted-foreground">
                  Deleting <span className="font-semibold text-foreground">{deletingTenant?.name}</span> will permanently remove all of its data including articles, events, users, settings, and everything else associated with this tenant.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-mono font-semibold text-foreground">{deletingTenant?.name}</span> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  placeholder="Type the tenant name here"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  autoComplete="off"
                  data-testid="input-delete-tenant-confirm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => { setDeletingTenant(null); setDeleteConfirmText(""); }}
                data-testid="button-cancel-delete-tenant"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== deletingTenant?.name || isDeleting}
                data-testid="button-confirm-delete-tenant"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
