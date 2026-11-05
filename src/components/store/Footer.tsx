import { Link } from "@tanstack/react-router";
import { Logo } from "./Header";

const helpLinks = [
  { to: "/delivery-policy", label: "ডেলিভারি তথ্য" },
  { to: "/return-policy", label: "রিটার্ন ও রিফান্ড নীতিমালা" },
  { to: "/warranty-policy", label: "ওয়ারেন্টি তথ্য" },
  { to: "/privacy-policy", label: "প্রাইভেসি পলিসি" },
  { to: "/terms", label: "শর্তাবলী" },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-deep text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-relaxed">
              ল্যাপটপ, গ্যাজেট ও প্রয়োজনীয় টেক অ্যাক্সেসরিজের বিশ্বস্ত অনলাইন শপ।
              সাশ্রয়ী দামে গ্রাহকের হাতে পৌঁছে দিই নিশ্চিন্তে, দেশজুড়ে।
            </p>
            <div className="mt-4 text-sm">
              <p className="font-semibold text-white">পেমেন্ট মাধ্যম</p>
              <p className="mt-1">ক্যাশ অন ডেলিভারি · bKash · Nagad</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-white">ক্যাটাগরি</p>
            <ul className="mt-3 grid gap-2 text-sm">
              <li><Link to="/products" className="hover:text-white">সকল পণ্য</Link></li>
              <li><Link to="/products" search={{ category: "laptops-computers" }} className="hover:text-white">ল্যাপটপ ও কম্পিউটার</Link></li>
              <li><Link to="/products" search={{ category: "headphones-earbuds" }} className="hover:text-white">হেডফোন ও ইয়ারবাড</Link></li>
              <li><Link to="/products" search={{ category: "keyboard-mouse" }} className="hover:text-white">কিবোর্ড ও মাউস</Link></li>
              <li><Link to="/products" search={{ category: "smartwatches" }} className="hover:text-white">স্মার্টওয়াচ</Link></li>
              <li><Link to="/products" search={{ category: "gaming-accessories" }} className="hover:text-white">গেমিং অ্যাক্সেসরিজ</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">সহায়তা ও নীতিমালা</p>
            <ul className="mt-3 grid gap-2 text-sm">
              {helpLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">যোগাযোগ</p>
            <ul className="mt-3 grid gap-2 text-sm">
              <li>ফোন: শীঘ্রই যুক্ত হবে</li>
              <li>ইমেইল: শীঘ্রই যুক্ত হবে</li>
              <li>ঠিকানা: শীঘ্রই যুক্ত হবে</li>
              <li className="text-white/60 text-xs">(ব্যবসার আসল তথ্য যুক্ত করা হবে)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Techno — সর্বস্বত্ব সংরক্ষিত
        </div>
      </div>
    </footer>
  );
}
