import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserCheck, Shield, Phone, Mail, CheckCircle2, AlertOctagon, UserPlus, Edit, Trash2, X, Plus, UserCheck2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffViewProps {
  users: User[];
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  onAddStaff?: (fullName: string, username: string, phone: string, email: string, role: UserRole, avatar?: string) => User;
  onUpdateStaff?: (userId: string, updatedData: Partial<User>) => void;
  onDeleteStaff?: (userId: string) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function StaffView({
  users,
  currentUser,
  onSwitchUser,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onShowConfirm,
  onShowAlert
}: StaffViewProps) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SELLER);
  const [avatar, setAvatar] = useState('');

  const openAddModal = () => {
    setFullName('');
    setUsername('');
    setPhone('');
    setEmail('');
    setRole(UserRole.SELLER);
    setAvatar('');
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setPhone(user.phone);
    setEmail(user.email);
    setRole(user.role);
    setAvatar(user.avatar || '');
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !phone.trim() || !email.trim()) {
      onShowAlert?.('Vui lòng điền đầy đủ thông tin nhân viên!', 'warning');
      return;
    }

    // Check if username already exists
    const duplicate = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (duplicate) {
      onShowAlert?.('Tên đăng nhập này đã tồn tại trên hệ thống!', 'error');
      return;
    }

    if (onAddStaff) {
      onAddStaff(fullName.trim(), username.trim(), phone.trim(), email.trim(), role, avatar.trim());
      onShowAlert?.('Thêm tài khoản nhân viên mới thành công!', 'success');
      setShowAddModal(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!fullName.trim() || !username.trim() || !phone.trim() || !email.trim()) {
      onShowAlert?.('Vui lòng điền đầy đủ thông tin nhân viên!', 'warning');
      return;
    }

    // Check duplicate username for other users
    const duplicate = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== selectedUser.id);
    if (duplicate) {
      onShowAlert?.('Tên đăng nhập này đã được sử dụng bởi nhân viên khác!', 'error');
      return;
    }

    if (onUpdateStaff) {
      onUpdateStaff(selectedUser.id, {
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        avatar: avatar.trim() || undefined
      });
      onShowAlert?.('Cập nhật thông tin và phân quyền nhân viên thành công!', 'success');
      setShowEditModal(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser.id) {
      onShowAlert?.('Không thể tự xóa tài khoản của chính mình đang giả lập đăng nhập!', 'error');
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân viên '${user.fullName}' (@${user.username})?\nThao tác này sẽ xóa sạch dữ liệu đăng nhập và thu hồi toàn bộ quyền truy cập của người này!`;

    if (onShowConfirm) {
      onShowConfirm(confirmMsg, () => {
        onDeleteStaff?.(user.id);
      });
    } else if (window.confirm(confirmMsg)) {
      onDeleteStaff?.(user.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active User Switch Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={currentUser.fullName}
            className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Đang mô phỏng đăng nhập</span>
            <h3 className="text-xl font-bold mt-1">{currentUser.fullName}</h3>
            <p className="text-white/80 text-xs">Vai trò hiện tại: <strong className="text-white bg-indigo-700/50 px-2 py-0.5 rounded-md font-mono text-[11px] ml-1">{currentUser.role}</strong></p>
          </div>
        </div>
        
        {/* Switch tools */}
        <div className="flex flex-col md:items-end gap-1.5">
          <span className="text-xs font-semibold text-white/90">Click để giả lập/đăng nhập nhân viên khác:</span>
          <div className="flex flex-wrap gap-1.5">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => onSwitchUser(u.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  currentUser.id === u.id
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currentUser.id === u.id && <UserCheck className="w-3.5 h-3.5" />}
                <span>{u.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff list panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Cơ sở dữ liệu nhân sự & Vai trò</h4>
              <p className="text-slate-400 text-xs mt-0.5">Danh sách toàn bộ nhân viên, cấu hình thông tin cá nhân và phân quyền hệ thống</p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/10 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Nhân Viên</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => {
              const isActive = currentUser.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`border rounded-2xl p-4 transition flex flex-col justify-between ${
                    isActive 
                      ? 'border-sky-500 bg-sky-50/10 shadow-lg shadow-sky-500/5' 
                      : 'border-slate-150 hover:border-slate-250 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={u.fullName}
                      className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="font-bold text-slate-800 text-sm truncate">{u.fullName}</h5>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Chỉnh sửa thông tin & vai trò"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Xóa nhân viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-400 font-mono mt-0.5">@{u.username}</p>
                      
                      <div className="space-y-1 mt-3.5 pt-3 border-t border-slate-100 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                      u.role === UserRole.ADMIN 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : u.role === UserRole.STOCKKEEPER 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {u.role}
                    </span>
                    
                    {isActive ? (
                      <span className="text-sky-600 font-bold text-[11px] flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                        <UserCheck className="w-3.5 h-3.5" /> 
                        <span>Đang đăng nhập</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSwitchUser(u.id)}
                        className="text-slate-500 hover:text-indigo-600 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer hover:bg-indigo-50 px-2 py-0.5 rounded-lg"
                      >
                        <span>Đăng nhập test &raquo;</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles details checklist */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Kiểm tra phân quyền hệ thống</h4>
            <p className="text-slate-400 text-xs mb-4">Các tác vụ được phép truy cập dựa trên vai trò đang giả lập</p>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 text-xs">
                <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-700">Vai trò đang kiểm tra:</span>
                  <span className="font-bold text-indigo-600 block text-sm mt-0.5">{currentUser.role}</span>
                </div>
              </div>

              {/* Permission list checkboxes */}
              <div className="space-y-3 text-xs pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">1. Bán hàng trực tiếp (Màn hình POS)</span>
                  {currentUser.role !== UserRole.STOCKKEEPER ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">2. Quản lý sản phẩm & Ngành hàng</span>
                  {currentUser.role !== UserRole.SELLER ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">3. Thêm mới đối tác & Thu nợ khách</span>
                  {currentUser.role !== UserRole.STOCKKEEPER ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-slate-600 font-medium">4. Điều chuyển nhân sự & Đổi cấu hình</span>
                  {currentUser.role === UserRole.ADMIN ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">5. Xuất bản sao lưu / Xóa dữ liệu</span>
                  {currentUser.role === UserRole.ADMIN ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed mt-6 font-medium">
            <span className="font-bold text-indigo-700 block mb-1">💡 Mẹo thử nghiệm:</span>
            Hãy đổi sang các vai trò nhân viên khác ở thanh tiêu đề để kiểm tra cách giao diện hạn chế quyền truy cập menu và tính năng tương ứng.
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW STAFF */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-600" />
                  <span className="font-bold text-slate-800 text-sm">Thêm Nhân Viên Mới</span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên nhân viên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                      placeholder="Ví dụ: Hoàng Văn An"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên đăng nhập (Username)</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition font-mono"
                      placeholder="Ví dụ: an_hw"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chức vụ / Quyền hạn</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition cursor-pointer"
                    >
                      <option value={UserRole.SELLER}>SELLER (Nhân viên bán hàng)</option>
                      <option value={UserRole.STOCKKEEPER}>STOCKKEEPER (Thủ kho)</option>
                      <option value={UserRole.ADMIN}>ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                      placeholder="Ví dụ: 0912345678"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
                      placeholder="Ví dụ: anhw@salesflow.vn"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link ảnh đại diện (Tùy chọn)</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition font-mono"
                      placeholder="Để trống để sử dụng ảnh mặc định"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-150 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-sky-600/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>LƯU NHÂN VIÊN</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT STAFF */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-sm">Chỉnh Sửa Thông Tin & Vai Trò</span>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên nhân viên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="Ví dụ: Nguyễn Thị Lan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên đăng nhập (Username)</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-mono"
                      placeholder="Ví dụ: lan_nt"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chức vụ / Quyền hạn</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition cursor-pointer"
                    >
                      <option value={UserRole.SELLER}>SELLER (Nhân viên bán hàng)</option>
                      <option value={UserRole.STOCKKEEPER}>STOCKKEEPER (Thủ kho)</option>
                      <option value={UserRole.ADMIN}>ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="Ví dụ: 0912345678"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                      placeholder="Ví dụ: lannt@salesflow.vn"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Link ảnh đại diện</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-mono"
                      placeholder="Ảnh cá nhân"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-slate-150 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CẬP NHẬT</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
