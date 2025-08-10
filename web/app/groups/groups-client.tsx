"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, ConfirmationModal, Modal, LoadingSpinner } from "@/lib/ui";
import { Plus, Users, Edit2, Trash2, Calendar, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface GroupsClientProps {
  groups: Group[];
  createGroup: (formData: FormData) => Promise<void>;
  updateGroup: (formData: FormData) => Promise<void>;
  deleteGroup: (formData: FormData) => Promise<void>;
}

export default function GroupsClient({ 
  groups, 
  createGroup, 
  updateGroup, 
  deleteGroup 
}: GroupsClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, startCreateTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    startCreateTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", newGroupName.trim());
        await createGroup(formData);
        setNewGroupName("");
        setIsCreateModalOpen(false);
        toast.success("Group created successfully!");
      } catch (error) {
        toast.error("Failed to create group");
      }
    });
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedGroup || !editGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    startUpdateTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", selectedGroup.id);
        formData.append("name", editGroupName.trim());
        await updateGroup(formData);
        setIsEditModalOpen(false);
        setSelectedGroup(null);
        toast.success("Group updated successfully!");
      } catch (error) {
        toast.error("Failed to update group");
      }
    });
  };

  const handleDelete = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedGroup) return;

    startDeleteTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", selectedGroup.id);
        await deleteGroup(formData);
        setIsDeleteModalOpen(false);
        setSelectedGroup(null);
        toast.success("Group deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete group");
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Manage your enterprise groups and teams</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
        </div>
      </Card>

      {/* Groups grid */}
      {filteredGroups.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No groups found" : "No groups yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Create your first group to get started with organizing your teams"
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Group
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(group.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit group"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Group"
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isCreating || !newGroupName.trim()}
              className="flex items-center space-x-2"
            >
              {isCreating && <LoadingSpinner size="sm" />}
              <span>{isCreating ? "Creating..." : "Create Group"}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Group"
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={editGroupName}
            onChange={(e) => setEditGroupName(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating || !editGroupName.trim()}
              className="flex items-center space-x-2"
            >
              {isUpdating && <LoadingSpinner size="sm" />}
              <span>{isUpdating ? "Updating..." : "Update Group"}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${selectedGroup?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
} 