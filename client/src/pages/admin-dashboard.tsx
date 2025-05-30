import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Package, 
  BarChart3, 
  Database, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Filter
} from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState("users");

  // Fetch admin data
  const { data: adminData } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: tableData } = useQuery({
    queryKey: ["/api/admin/table", selectedTable, searchTerm],
    queryFn: async () => {
      const url = `/api/admin/table/${selectedTable}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
      console.log('Frontend: Making request to:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Frontend: Received data:', data);
      return data;
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["/api/admin/tables"],
  });

  // Mutations for CRUD operations
  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const response = await fetch(`/api/admin/${table}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Ошибка удаления");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/table", selectedTable, searchTerm] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Запись удалена успешно" });
    },
    onError: () => {
      toast({ 
        variant: "destructive", 
        title: "Ошибка удаления записи" 
      });
    },
  });

  const handleLogout = () => {
    fetch("/api/admin/logout", { method: "POST" });
    setLocation("/");
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту запись?")) {
      deleteMutation.mutate({ table: selectedTable, id });
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Админ панель</h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Пользователи</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminData?.userCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Продукты</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminData?.productCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Анализы</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminData?.analysisCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Таблицы</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tables?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Управление базой данных</span>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTable} onValueChange={setSelectedTable}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="products">Продукты</TabsTrigger>
                <TabsTrigger value="analyses">Анализы</TabsTrigger>
                <TabsTrigger value="ingredients">Ингредиенты</TabsTrigger>
                <TabsTrigger value="sms_codes">SMS коды</TabsTrigger>
              </TabsList>

              {["users", "products", "analyses", "ingredients", "sms_codes"].map((table) => (
                <TabsContent key={table} value={table} className="mt-6">
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        {table === "users" && "Пользователи"}
                        {table === "products" && "Продукты"}
                        {table === "analyses" && "Анализы"}
                        {table === "ingredients" && "Ингредиенты"}
                        {table === "sms_codes" && "SMS коды"}
                      </h3>
                      <Badge variant="secondary">
                        {tableData?.length || 0} записей
                      </Badge>
                    </div>

                    {/* Table Content */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {tableData && Array.isArray(tableData) && tableData.length > 0 && Object.keys(tableData[0]).map((column) => (
                                <th key={column} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {column}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Действия
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableData && Array.isArray(tableData) && tableData.map((record: any, index: number) => (
                              <tr key={record.id || index}>
                                {Object.entries(record).map(([key, value]) => (
                                  <td key={key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="max-w-xs truncate" title={String(value)}>
                                      {formatValue(value)}
                                    </div>
                                  </td>
                                ))}
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="text-red-600 hover:text-red-800"
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {(!tableData || !Array.isArray(tableData) || tableData.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        {selectedTable === "users" && "Пользователи не найдены"}
                        {selectedTable === "products" && "Продукты не найдены"}
                        {selectedTable === "analyses" && "Анализы не найдены"}
                        {selectedTable === "ingredients" && "Ингредиенты не найдены"}
                        {selectedTable === "sms_codes" && "SMS коды не найдены"}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}