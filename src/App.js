import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/login/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./utils/PrivateRoute";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProductsPage from "./pages/product/ProductsPage";
import EditProductPage from "./pages/product/EditProductPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/not_fond/NotFound"; // Import the NotFound component
import BlogIndexPage from "./pages/blog/BlogIndexPage";
import AddBlogPage from "./pages/blog/AddBlogPage";
import EditBlogPage from "./pages/blog/EditBlogPage";
import Banner from "./pages/landing/banner/Banner";
import Comment from "./pages/landing/faq/FaqIndex";
import Content from "./pages/landing/content/Content";
import FaqIndex from "./pages/landing/faq/FaqIndex";
import AddFAQ from "./pages/landing/faq/FaqAdd";
import EditFAQ from "./pages/landing/faq/FaqEdit";
import CategoryIndex from "./pages/category/CategoryIndex";
import AddCategoryPage from "./pages/category/AddCategoryPage";
import EditCategoryPage from "./pages/category/EditCategoryPage";
import BrandIndex from "./pages/brand/BrandIndex";
import AddBrand from "./pages/brand/AddBrand";
import EditBrand from "./pages/brand/EditBrand";
import UserIndex from "./pages/user/UserIndex";
import UserForm from "./pages/user/UserForm";
import AttributesPage from "./pages/attribute/AttributesPage";
import RoleManagement from "./pages/user/role";
import SettingList from "./pages/setting/Setting";
import UsersPage from "./pages/user/UserIndex";
import { isAuthenticated } from "./services/auth";
import OrderList from "./components/orders/OrderList";
import OrderDetail from "./components/orders/OrderDetails";
import SubscriptionPage from "./pages/subscription/subscription";
import NotificationsPage from "./pages/notifications/notifications";
import UnreadNotificationsPage from "./pages/notifications/unreadNotification";
import MyNotificationsPage from "./pages/notifications/myNotification";
import CommentsPage from "./pages/comments/Comments";
import FaqBlogList from "./pages/faq/blog faq/FaqBlogIndex";
import AddFaqBlog from "./pages/faq/blog faq/AddFaqBlog";
import EditFaqBlog from "./pages/faq/blog faq/EditFaqBlog";
import FaqCreate from "./pages/faq/plan faq/AddFaqPlan";
import FaqEdit from "./pages/faq/plan faq/EditFaqPlan";
import MediaGallery from "./pages/gallery/Gallery";
import ProductIndex from "./pages/product/main product/productIndex";
import AddProduct from "./pages/product/main product/addProduct";
import CategoryBlogIndex from "./pages/blog/blog category/blogCategoryIndex";
import AddCategoryBlogPage from "./pages/blog/blog category/addBlogCategory";
import EditCategoryBlogPage from "./pages/blog/blog category/editBlogCategory";
import ProductVariationIndex from "./pages/product/ProductsPage";
import AddVariationProduct from "./pages/product/AddProductPage";
import EditProductVariation from "./pages/product/EditProductPage";
import EditProduct from "./pages/product/main product/editProduct";
import Carriers from "./pages/career/careerIndex";
import AddEditCarrier from "./pages/career/careerCreate";
import TicketsIndex from "./pages/ticket/ticket";
import DiscountsIndex from "./pages/discount/discount code/discount";
import DiscountCreate from "./pages/discount/discount code/AddDiscount";
import AddDiscount from "./pages/discount/discount code/AddDiscount";
import DiscountCampaign from "./pages/discount/discount code/discount";
import EditDiscount from "./pages/discount/discount code/EditDiscount";
import CampaignIndex from "./pages/discount/campaign/campaign";
import AddCampaign from "./pages/discount/campaign/addCampaign";
import EditCampaign from "./pages/discount/campaign/editCampaign";
import FilterIndex from "./pages/filter/FilterIndex";
import AddFilter from "./pages/filter/AddFilter";
import EditFilter from "./pages/filter/EditFilter";
import GlobalPropertyIndex from "./pages/globalProperty/GlobalPropertyIndex";
import AddGlobalProperty from "./pages/globalProperty/AddGlobalProperty";
import EditGlobalProperty from "./pages/globalProperty/EditGlobalProperty";
import ManualOrderPanel from "./components/orders/ManualOder";
import ManualOrderCreation from "./pages/orders/ManualOrderCreation";
import PackagingOrderDetails from "./pages/orders/PackagingOrderDetails";
import OrderLogsPage from "./pages/orders/OrderLogsPage";
import CancellationsList from "./pages/orders/cancel";
import BoxViewPage from "./pages/orders/BoxViewPage";
import StaffIndex from "./pages/staff/StaffIndex";
import InvoiceIndex from "./pages/invoices/InvoiceIndex";
import InvoiceShow from "./pages/invoices/InvoiceShow";
import InvoicePricingPage from "./pages/invoices/InvoicePricingPage";
import InvoiceEditPricingPage from "./pages/invoices/InvoiceEditPricingPage";
import CustomerIndex from "./pages/customer/CustomerIndex";
import CustomerShow from "./pages/customer/CustomerShow";
import RequirePermission from "./components/RequirePermission";
import FirstAllowedRedirect from "./components/FirstAllowedRedirect";
import AuthValidator from "./components/AuthValidator";
import NetworkStatus from "./components/NetworkStatus";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NetworkStatus />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            > */}
            <Route
              path="/"
              element={
                isAuthenticated() ? (
                  <AuthValidator>
                    <AppLayout />
                  </AuthValidator>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route index element={<FirstAllowedRedirect />} />
              <Route path="/dashboard" element={<RequirePermission permission="dashboard"><Dashboard /></RequirePermission>} />

              <Route path="products" element={<ProductIndex />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={< EditProduct/>} />
              <Route path="productsVariation" element={<ProductVariationIndex />} />
              <Route path="productsVariation/add/:productId?" element={<AddVariationProduct />} />
              <Route path="productsVariation/edit/:id" element={<EditProductVariation />} />


              

              <Route path="/categories" element={<CategoryIndex />} />
              <Route path="/categories/add" element={<AddCategoryPage />} />
              <Route
                path="/categories/edit/:id"
                element={<EditCategoryPage />}
              />

              <Route path="/users" element={<UsersPage />} />
              {/* <Route path="/users/add" element={<UserForm />} />
              <Route path="/users/edit/:id" element={<UserForm />} /> */}
              <Route path="/staff" element={<StaffIndex />} />

              <Route path="/roles" element={<RoleManagement />} />

              <Route path="/setting" element={<SettingList />} />

              <Route path="/attributes" element={<AttributesPage />} />

              {/* <Route path="/brands" element={<BrandIndex />} />
              <Route path="/brands/add" element={<AddBrand />} /> 
              <Route path="/brands/edit/:id" element={<EditBrand />} /> */}

              {/* <Route path="/blogs" element={<BlogIndexPage />} />
              <Route path="/blogs/add" element={<AddBlogPage />} />
              <Route path="/blogs/edit/:id" element={<EditBlogPage />} />

              <Route path="/blog-categories" element={<CategoryBlogIndex />} />
              <Route path="/blog-categories/add" element={<AddCategoryBlogPage />} />
              <Route path="/blog-categories/edit/:id" element={<EditCategoryBlogPage />} /> */}


              

              

              <Route path="/orders" element={<OrderList />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/orders/packaging/:id" element={<PackagingOrderDetails />} />
              <Route path="/orders/logs/:id" element={<OrderLogsPage />} />
              <Route path="/orders/box/:itemId" element={<BoxViewPage />} />
              <Route path="/orders/manual/:orderId" element={<ManualOrderCreation />} />
              <Route path="/orders/manual" element={<ManualOrderPanel />} />
              <Route path="/cancellations" element={<CancellationsList />} />

              <Route path="/invoices" element={<RequirePermission permission="order"><InvoiceIndex /></RequirePermission>} />
              <Route path="/invoices/:id" element={<RequirePermission permission="order"><InvoiceShow /></RequirePermission>} />
              <Route path="/invoices/:id/scan" element={<RequirePermission permission="order"><InvoicePricingPage /></RequirePermission>} />
              <Route path="/invoices/:id/edit-pricing" element={<RequirePermission permission="order"><InvoiceEditPricingPage /></RequirePermission>} />

              <Route path="/customers" element={<RequirePermission permission="customer"><CustomerIndex /></RequirePermission>} />
              <Route path="/customers/:id" element={<RequirePermission permission="customer"><CustomerShow /></RequirePermission>} />

              <Route path="/subscription" element={<SubscriptionPage />} />

              {/* <Route path="/career" element={<Carriers />} />
              <Route path="/carriers/add" element={<AddEditCarrier />} />
              <Route path="/carriers/edit/:id" element={<AddEditCarrier />} /> */}

              

              {/* <Route path="/comments" element={<CommentsPage />} /> */}

              <Route path="/tickets" element={<TicketsIndex />} />

              

              <Route path="/faq/plan" element={<FaqIndex />} />
              <Route path="/faq/plan/add" element={<FaqCreate />} />
              <Route path="/faq/plan/edit/:id" element={<FaqEdit />} />

              {/* <Route path="/discounts" element={<DiscountsIndex />} />
              <Route path="/discounts/add" element={<AddDiscount />} />
              <Route path="/discounts/edit/:id" element={<EditDiscount />} /> */}

              {/* <Route path="/campaigns" element={<CampaignIndex />} />
              <Route path="/campaigns/add" element={<AddCampaign />} />
              <Route path="/campaigns/edit/:id" element={<EditCampaign />} /> */}

              {/* <Route path="/filters" element={<FilterIndex />} />
              <Route path="/filters/add" element={<AddFilter />} />
              <Route path="/filters/edit/:id" element={<EditFilter />} /> */}

              {/* <Route path="/global-properties" element={<GlobalPropertyIndex />} />
              <Route path="/global-properties/add" element={<AddGlobalProperty />} />
              <Route path="/global-properties/edit/:id" element={<EditGlobalProperty />} /> */}

             


              <Route path="/faq/blog" element={<FaqBlogList />} />
              <Route path="/faq/blog/add" element={<AddFaqBlog />} />
              <Route path="/faq/blog/edit/:id" element={<EditFaqBlog />} />


              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/my_notifications" element={<MyNotificationsPage />} />
              <Route path="/unread_notifications" element={<UnreadNotificationsPage />} />


              {/* <Route path="/gallery" element={<MediaGallery />} /> */}



              

              <Route path="/landing/banner" element={<Banner />} />
              <Route path="/landing/faq_list" element={<FaqIndex />} />
              <Route path="/add-faq" element={<AddFAQ />} />
              <Route path="/edit-faq/:id" element={<EditFAQ />} />
              <Route path="/landing/content" element={<Content />} />
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
