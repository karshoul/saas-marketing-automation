import Tenant from './Tenant.js';
import Subscription from './Subscription.js';
import Contact from './Contact.js';
import Campaign from './Campaign.js';

// Gom tất cả các Models lại thành một đối tượng duy nhất để dễ quản lý và import sau này
const db = {
  Tenant,
  Subscription,
  Contact,
  Campaign
};

console.log('🗃️ Tất cả các MongoDB Models (Schemas) đã được đăng ký và khởi tạo thành công!');

export default db;