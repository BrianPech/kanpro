"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import * as HugeIcons from "@hugeicons/core-free-icons";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  color?: string;
}

export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

export function createIcon(icon: any, displayName: string): IconComponent {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size, strokeWidth = 2, className, ...props }, ref) => {
      const parsedStrokeWidth =
        strokeWidth !== undefined ? Number(strokeWidth) : 2;
      return (
        <HugeiconsIcon
          ref={ref}
          icon={icon}
          size={size}
          strokeWidth={parsedStrokeWidth}
          className={className}
          {...props}
        />
      );
    }
  );
  Component.displayName = displayName;
  return Component;
}

export type LucideIcon = IconComponent;
export type LucideProps = IconProps;
export { HugeiconsIcon };

export const Activity = createIcon(HugeIcons.ActivityIcon, "Activity");
export const AlertCircle = createIcon(HugeIcons.AlertCircleIcon, "AlertCircle");
export const AlertTriangle = createIcon(HugeIcons.AlertTriangle, "AlertTriangle");
export const AlertTriangleIcon = createIcon(HugeIcons.AlertTriangle, "AlertTriangleIcon");
export const ArrowDown = createIcon(HugeIcons.ArrowDownIcon, "ArrowDown");
export const ArrowLeft = createIcon(HugeIcons.ArrowLeftIcon, "ArrowLeft");
export const ArrowLeftIcon = createIcon(HugeIcons.ArrowLeftIcon, "ArrowLeftIcon");
export const ArrowRight = createIcon(HugeIcons.ArrowRightIcon, "ArrowRight");
export const ArrowUp = createIcon(HugeIcons.ArrowUpIcon, "ArrowUp");
export const ArrowUpDown = createIcon(HugeIcons.ArrowUpDownIcon, "ArrowUpDown");
export const ArrowUpRight = createIcon(HugeIcons.ArrowUpRightIcon, "ArrowUpRight");
export const Award = createIcon(HugeIcons.AwardIcon, "Award");
export const Baby = createIcon(HugeIcons.BabyIcon, "Baby");
export const BadgeCheck = createIcon(HugeIcons.BadgeCheckIcon, "BadgeCheck");
export const BanIcon = createIcon(HugeIcons.BanIcon, "BanIcon");
export const BarChart3 = createIcon(HugeIcons.BarChartIcon, "BarChart3");
export const Bell = createIcon(HugeIcons.BellIcon, "Bell");
export const BellIcon = createIcon(HugeIcons.BellIcon, "BellIcon");
export const BellRing = createIcon(HugeIcons.BellRingIcon, "BellRing");
export const Bold = createIcon(HugeIcons.BoldIcon, "Bold");
export const BookOpen = createIcon(HugeIcons.BookOpenIcon, "BookOpen");
export const Bookmark = createIcon(HugeIcons.BookmarkIcon, "Bookmark");
export const Briefcase = createIcon(HugeIcons.BriefcaseIcon, "Briefcase");
export const Building = createIcon(HugeIcons.BuildingIcon, "Building");
export const Building2 = createIcon(HugeIcons.Building2, "Building2");
export const Building2Icon = createIcon(HugeIcons.Building2, "Building2Icon");
export const Calendar = createIcon(HugeIcons.CalendarIcon, "Calendar");
export const CalendarCheck = createIcon(HugeIcons.CalendarCheckIcon, "CalendarCheck");
export const CalendarClock = createIcon(HugeIcons.CalendarClockIcon, "CalendarClock");
export const CalendarDays = createIcon(HugeIcons.CalendarDaysIcon, "CalendarDays");
export const CalendarPlus = createIcon(HugeIcons.CalendarPlusIcon, "CalendarPlus");
export const Camera = createIcon(HugeIcons.CameraIcon, "Camera");
export const CameraOff = createIcon(HugeIcons.CameraOffIcon, "CameraOff");
export const Check = createIcon(HugeIcons.CheckIcon, "Check");
export const CheckCheck = createIcon(HugeIcons.CheckCheckIcon, "CheckCheck");
export const CheckCircle = createIcon(HugeIcons.CheckCircle, "CheckCircle");
export const CheckCircle2 = createIcon(HugeIcons.CheckmarkCircle02Icon, "CheckCircle2");
export const CheckCircle2Icon = createIcon(HugeIcons.CheckmarkCircle02Icon, "CheckCircle2Icon");
export const CheckIcon = createIcon(HugeIcons.CheckIcon, "CheckIcon");
export const CheckSquare = createIcon(HugeIcons.CheckSquare, "CheckSquare");
export const ChevronDown = createIcon(HugeIcons.ChevronDownIcon, "ChevronDown");
export const ChevronDownIcon = createIcon(HugeIcons.ChevronDownIcon, "ChevronDownIcon");
export const ChevronLeft = createIcon(HugeIcons.ChevronLeftIcon, "ChevronLeft");
export const ChevronLeftIcon = createIcon(HugeIcons.ChevronLeftIcon, "ChevronLeftIcon");
export const ChevronRight = createIcon(HugeIcons.ChevronRightIcon, "ChevronRight");
export const ChevronRightIcon = createIcon(HugeIcons.ChevronRightIcon, "ChevronRightIcon");
export const ChevronUp = createIcon(HugeIcons.ChevronUpIcon, "ChevronUp");
export const ChevronsLeft = createIcon(HugeIcons.ChevronsLeftIcon, "ChevronsLeft");
export const ChevronsLeftIcon = createIcon(HugeIcons.ChevronsLeftIcon, "ChevronsLeftIcon");
export const ChevronsRight = createIcon(HugeIcons.ChevronsRightIcon, "ChevronsRight");
export const ChevronsRightIcon = createIcon(HugeIcons.ChevronsRightIcon, "ChevronsRightIcon");
export const ChevronsUpDown = createIcon(HugeIcons.ChevronsUpDown, "ChevronsUpDown");
export const ChevronsUpDownIcon = createIcon(HugeIcons.ChevronsUpDown, "ChevronsUpDownIcon");
export const Circle = createIcon(HugeIcons.CircleIcon, "Circle");
export const CircleCheck = createIcon(HugeIcons.CircleCheckIcon, "CircleCheck");
export const CircleCheckIcon = createIcon(HugeIcons.CircleCheckIcon, "CircleCheckIcon");
export const CirclePercent = createIcon(HugeIcons.CirclePercent, "CirclePercent");
export const Clock = createIcon(HugeIcons.ClockIcon, "Clock");
export const ClockIcon = createIcon(HugeIcons.ClockIcon, "ClockIcon");
export const Coffee = createIcon(HugeIcons.CoffeeIcon, "Coffee");
export const Coins = createIcon(HugeIcons.CoinsIcon, "Coins");
export const CoinsIcon = createIcon(HugeIcons.CoinsIcon, "CoinsIcon");
export const Columns3Icon = createIcon(HugeIcons.Columns3, "Columns3Icon");
export const Compass = createIcon(HugeIcons.CompassIcon, "Compass");
export const Cookie = createIcon(HugeIcons.CookieIcon, "Cookie");
export const CookieIcon = createIcon(HugeIcons.CookieIcon, "CookieIcon");
export const Copy = createIcon(HugeIcons.CopyIcon, "Copy");
export const CreditCard = createIcon(HugeIcons.CreditCardIcon, "CreditCard");
export const Database = createIcon(HugeIcons.DatabaseIcon, "Database");
export const DollarSign = createIcon(HugeIcons.DollarSignIcon, "DollarSign");
export const Download = createIcon(HugeIcons.DownloadIcon, "Download");
export const Edit2 = createIcon(HugeIcons.Edit02Icon, "Edit2");
export const Edit3 = createIcon(HugeIcons.PencilEdit01Icon, "Edit3");
export const EllipsisVerticalIcon = createIcon(HugeIcons.EllipsisVerticalIcon, "EllipsisVerticalIcon");
export const ExternalLink = createIcon(HugeIcons.ExternalLinkIcon, "ExternalLink");
export const ExternalLinkIcon = createIcon(HugeIcons.ExternalLinkIcon, "ExternalLinkIcon");
export const Eye = createIcon(HugeIcons.EyeIcon, "Eye");
export const EyeIcon = createIcon(HugeIcons.EyeIcon, "EyeIcon");
export const EyeOff = createIcon(HugeIcons.EyeOffIcon, "EyeOff");
export const FileCheck = createIcon(HugeIcons.FileCheckIcon, "FileCheck");
export const FileCheck2 = createIcon(HugeIcons.FileCheckIcon, "FileCheck2");
export const FileCode = createIcon(HugeIcons.FileCodeIcon, "FileCode");
export const FileDown = createIcon(HugeIcons.FileDownIcon, "FileDown");
export const FileQuestion = createIcon(HugeIcons.FileQuestionMarkIcon, "FileQuestion");
export const FileSignature = createIcon(HugeIcons.SignatureIcon, "FileSignature");
export const FileSpreadsheet = createIcon(HugeIcons.FileSpreadsheetIcon, "FileSpreadsheet");
export const FileText = createIcon(HugeIcons.FileTextIcon, "FileText");
export const FileTextIcon = createIcon(HugeIcons.FileTextIcon, "FileTextIcon");
export const Filter = createIcon(HugeIcons.FilterIcon, "Filter");
export const Flame = createIcon(HugeIcons.FlameIcon, "Flame");
export const FolderLock = createIcon(HugeIcons.FolderLockIcon, "FolderLock");
export const Gift = createIcon(HugeIcons.GiftIcon, "Gift");
export const Globe = createIcon(HugeIcons.GlobeIcon, "Globe");
export const GraduationCap = createIcon(HugeIcons.GraduationCapIcon, "GraduationCap");
export const GripVerticalIcon = createIcon(HugeIcons.GripVerticalIcon, "GripVerticalIcon");
export const Heading2 = createIcon(HugeIcons.Heading2, "Heading2");
export const Heading3 = createIcon(HugeIcons.Heading3, "Heading3");
export const Headphones = createIcon(HugeIcons.HeadphonesIcon, "Headphones");
export const HeadphonesIcon = createIcon(HugeIcons.HeadphonesIcon, "HeadphonesIcon");
export const HeartHandshake = createIcon(HugeIcons.HeartHandshakeIcon, "HeartHandshake");
export const HeartPulse = createIcon(HugeIcons.HeartPulseIcon, "HeartPulse");
export const HelpCircle = createIcon(HugeIcons.HelpCircleIcon, "HelpCircle");
export const HelpCircleIcon = createIcon(HugeIcons.HelpCircleIcon, "HelpCircleIcon");
export const Home = createIcon(HugeIcons.HomeIcon, "Home");
export const Image = createIcon(HugeIcons.ImageIcon, "Image");
export const Inbox = createIcon(HugeIcons.InboxIcon, "Inbox");
export const Info = createIcon(HugeIcons.InfoIcon, "Info");
export const Italic = createIcon(HugeIcons.ItalicIcon, "Italic");
export const Kanban = createIcon(HugeIcons.KanbanIcon, "Kanban");
export const Key = createIcon(HugeIcons.KeyIcon, "Key");
export const KeyRound = createIcon(HugeIcons.KeyRoundIcon, "KeyRound");
export const KeyRoundIcon = createIcon(HugeIcons.KeyRoundIcon, "KeyRoundIcon");
export const Keyboard = createIcon(HugeIcons.KeyboardIcon, "Keyboard");
export const Laptop = createIcon(HugeIcons.LaptopIcon, "Laptop");
export const Layers = createIcon(HugeIcons.LayersIcon, "Layers");
export const LayoutDashboard = createIcon(HugeIcons.LayoutDashboardIcon, "LayoutDashboard");
export const LayoutGrid = createIcon(HugeIcons.LayoutGridIcon, "LayoutGrid");
export const LifeBuoy = createIcon(HugeIcons.LifeBuoy, "LifeBuoy");
export const LifeBuoyIcon = createIcon(HugeIcons.LifeBuoy, "LifeBuoyIcon");
export const Lightbulb = createIcon(HugeIcons.LightbulbIcon, "Lightbulb");
export const Link = createIcon(HugeIcons.LinkIcon, "Link");
export const List = createIcon(HugeIcons.ListIcon, "List");
export const ListOrdered = createIcon(HugeIcons.ListOrderedIcon, "ListOrdered");
export const ListX = createIcon(HugeIcons.ListXIcon, "ListX");
export const Loader2 = createIcon(HugeIcons.Loading02Icon, "Loader2");
export const LoaderCircleIcon = createIcon(HugeIcons.LoaderCircleIcon, "LoaderCircleIcon");
export const LoaderIcon = createIcon(HugeIcons.LoaderIcon, "LoaderIcon");
export const Lock = createIcon(HugeIcons.LockIcon, "Lock");
export const LockIcon = createIcon(HugeIcons.LockIcon, "LockIcon");
export const LogIn = createIcon(HugeIcons.LogInIcon, "LogIn");
export const LogOut = createIcon(HugeIcons.LogOutIcon, "LogOut");
export const LogOutIcon = createIcon(HugeIcons.LogOutIcon, "LogOutIcon");
export const Mail = createIcon(HugeIcons.MailIcon, "Mail");
export const MailCheck = createIcon(HugeIcons.MailCheckIcon, "MailCheck");
export const MailIcon = createIcon(HugeIcons.MailIcon, "MailIcon");
export const MapPin = createIcon(HugeIcons.MapPinIcon, "MapPin");
export const Maximize2 = createIcon(HugeIcons.Maximize2, "Maximize2");
export const Menu = createIcon(HugeIcons.MenuIcon, "Menu");
export const MessageCircle = createIcon(HugeIcons.MessageCircleIcon, "MessageCircle");
export const MessageCircleIcon = createIcon(HugeIcons.MessageCircleIcon, "MessageCircleIcon");
export const MessageSquare = createIcon(HugeIcons.MessageSquareIcon, "MessageSquare");
export const MessageSquareIcon = createIcon(HugeIcons.MessageSquareIcon, "MessageSquareIcon");
export const MessageSquareText = createIcon(HugeIcons.MessageSquareTextIcon, "MessageSquareText");
export const MessageSquareWarning = createIcon(HugeIcons.MessageSquareWarningIcon, "MessageSquareWarning");
export const Minimize2 = createIcon(HugeIcons.Minimize2, "Minimize2");
export const Minus = createIcon(HugeIcons.MinusIcon, "Minus");
export const Moon = createIcon(HugeIcons.MoonIcon, "Moon");
export const MoreHorizontal = createIcon(HugeIcons.MoreHorizontalIcon, "MoreHorizontal");
export const MoreHorizontalIcon = createIcon(HugeIcons.MoreHorizontalIcon, "MoreHorizontalIcon");
export const MoreVertical = createIcon(HugeIcons.MoreVerticalIcon, "MoreVertical");
export const Navigation = createIcon(HugeIcons.NavigationIcon, "Navigation");
export const Palette = createIcon(HugeIcons.PaletteIcon, "Palette");
export const Palmtree = createIcon(HugeIcons.TreePalmIcon, "Palmtree");
export const Paperclip = createIcon(HugeIcons.PaperclipIcon, "Paperclip");
export const PauseCircle = createIcon(HugeIcons.PauseCircleIcon, "PauseCircle");
export const PenTool = createIcon(HugeIcons.PenToolIcon, "PenTool");
export const Pencil = createIcon(HugeIcons.PencilIcon, "Pencil");
export const Phone = createIcon(HugeIcons.PhoneIcon, "Phone");
export const PhoneIcon = createIcon(HugeIcons.PhoneIcon, "PhoneIcon");
export const Pipette = createIcon(HugeIcons.PipetteIcon, "Pipette");
export const Plane = createIcon(HugeIcons.PlaneIcon, "Plane");
export const PlayCircle = createIcon(HugeIcons.PlayCircleIcon, "PlayCircle");
export const Plus = createIcon(HugeIcons.PlusIcon, "Plus");
export const PlusCircle = createIcon(HugeIcons.PlusSignCircleIcon, "PlusCircle");
export const PlusIcon = createIcon(HugeIcons.PlusIcon, "PlusIcon");
export const Printer = createIcon(HugeIcons.PrinterIcon, "Printer");
export const QrCode = createIcon(HugeIcons.QrCodeIcon, "QrCode");
export const QrCodeIcon = createIcon(HugeIcons.QrCodeIcon, "QrCodeIcon");
export const Quote = createIcon(HugeIcons.QuoteIcon, "Quote");
export const Radio = createIcon(HugeIcons.RadioIcon, "Radio");
export const Receipt = createIcon(HugeIcons.ReceiptIcon, "Receipt");
export const Redo = createIcon(HugeIcons.RedoIcon, "Redo");
export const RefreshCw = createIcon(HugeIcons.RefreshCwIcon, "RefreshCw");
export const RemoveFormatting = createIcon(HugeIcons.RemoveFormattingIcon, "RemoveFormatting");
export const RotateCcw = createIcon(HugeIcons.RotateCcwIcon, "RotateCcw");
export const RotateCcwIcon = createIcon(HugeIcons.RotateCcwIcon, "RotateCcwIcon");
export const RotateCw = createIcon(HugeIcons.RotateCwIcon, "RotateCw");
export const Save = createIcon(HugeIcons.SaveIcon, "Save");
export const Scale = createIcon(HugeIcons.ScaleIcon, "Scale");
export const Search = createIcon(HugeIcons.SearchIcon, "Search");
export const SearchIcon = createIcon(HugeIcons.SearchIcon, "SearchIcon");
export const SearchX = createIcon(HugeIcons.SearchXIcon, "SearchX");
export const Send = createIcon(HugeIcons.SendIcon, "Send");
export const SendIcon = createIcon(HugeIcons.SendIcon, "SendIcon");
export const Settings = createIcon(HugeIcons.SettingsIcon, "Settings");
export const Settings2 = createIcon(HugeIcons.Settings2, "Settings2");
export const SettingsIcon = createIcon(HugeIcons.SettingsIcon, "SettingsIcon");
export const Share2 = createIcon(HugeIcons.Share2, "Share2");
export const Shield = createIcon(HugeIcons.ShieldIcon, "Shield");
export const ShieldAlert = createIcon(HugeIcons.ShieldAlertIcon, "ShieldAlert");
export const ShieldAlertIcon = createIcon(HugeIcons.ShieldAlertIcon, "ShieldAlertIcon");
export const ShieldCheck = createIcon(HugeIcons.ShieldCheckIcon, "ShieldCheck");
export const ShieldCheckIcon = createIcon(HugeIcons.ShieldCheckIcon, "ShieldCheckIcon");
export const SlidersHorizontal = createIcon(HugeIcons.SlidersHorizontalIcon, "SlidersHorizontal");
export const Smartphone = createIcon(HugeIcons.SmartphoneIcon, "Smartphone");
export const Sparkles = createIcon(HugeIcons.SparklesIcon, "Sparkles");
export const SparklesIcon = createIcon(HugeIcons.SparklesIcon, "SparklesIcon");
export const Star = createIcon(HugeIcons.StarIcon, "Star");
export const Strikethrough = createIcon(HugeIcons.StrikethroughIcon, "Strikethrough");
export const Sun = createIcon(HugeIcons.SunIcon, "Sun");
export const SunMoon = createIcon(HugeIcons.SunMoonIcon, "SunMoon");
export const SwitchCamera = createIcon(HugeIcons.SwitchCameraIcon, "SwitchCamera");
export const Tag = createIcon(HugeIcons.TagIcon, "Tag");
export const Target = createIcon(HugeIcons.TargetIcon, "Target");
export const ThumbsDown = createIcon(HugeIcons.ThumbsDownIcon, "ThumbsDown");
export const ThumbsUp = createIcon(HugeIcons.ThumbsUpIcon, "ThumbsUp");
export const Trash2 = createIcon(HugeIcons.Trash2, "Trash2");
export const TrendingUp = createIcon(HugeIcons.TrendingUpIcon, "TrendingUp");
export const TrendingUpIcon = createIcon(HugeIcons.TrendingUpIcon, "TrendingUpIcon");
export const Tv = createIcon(HugeIcons.TvIcon, "Tv");
export const Type = createIcon(HugeIcons.TypeIcon, "Type");
export const Undo = createIcon(HugeIcons.UndoIcon, "Undo");
export const Unlink = createIcon(HugeIcons.UnlinkIcon, "Unlink");
export const Upload = createIcon(HugeIcons.UploadIcon, "Upload");
export const UploadCloud = createIcon(HugeIcons.CloudUploadIcon, "UploadCloud");
export const User = createIcon(HugeIcons.UserIcon, "User");
export const UserCheck = createIcon(HugeIcons.UserCheckIcon, "UserCheck");
export const UserCheckIcon = createIcon(HugeIcons.UserCheckIcon, "UserCheckIcon");
export const UserCog = createIcon(HugeIcons.UserCogIcon, "UserCog");
export const UserIcon = createIcon(HugeIcons.UserIcon, "UserIcon");
export const UserPlus = createIcon(HugeIcons.UserPlusIcon, "UserPlus");
export const UserPlusIcon = createIcon(HugeIcons.UserPlusIcon, "UserPlusIcon");
export const UserX = createIcon(HugeIcons.UserXIcon, "UserX");
export const Users = createIcon(HugeIcons.UsersIcon, "Users");
export const Video = createIcon(HugeIcons.VideoIcon, "Video");
export const WifiOff = createIcon(HugeIcons.WifiOffIcon, "WifiOff");
export const WrenchIcon = createIcon(HugeIcons.WrenchIcon, "WrenchIcon");
export const X = createIcon(HugeIcons.XIcon, "X");
export const XCircle = createIcon(HugeIcons.XCircle, "XCircle");
export const XCircleIcon = createIcon(HugeIcons.XCircle, "XCircleIcon");
export const XIcon = createIcon(HugeIcons.XIcon, "XIcon");
export const Zap = createIcon(HugeIcons.ZapIcon, "Zap");


export interface KanproIsotypeProps extends React.SVGProps<SVGSVGElement> {
  variant?: "white" | "color" | "monochrome";
}

export function KanproIsotype({
  className,
  variant = "white",
  ...props
}: KanproIsotypeProps) {
  const isColor = variant === "color";
  const isWhite = variant === "white";

  return (
    <svg
      viewBox="0 0 58 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M0 5.7767C0 -1.2233 10 -2.2233 12 4.7767V58.7767C12 65.7767 0 64.7767 0 57.7767V5.7767Z"
        fill={isColor ? "#F4F7F6" : isWhite ? "white" : "currentColor"}
      />
      <path
        d="M18 28.7767C18 14.7767 28 1.7767 46 1.7767C56 1.7767 60 8.7767 56 16.7767C50 28.7767 32 29.7767 18 28.7767Z"
        fill={isColor ? "#1447E6" : isWhite ? "white" : "currentColor"}
      />
      <path
        d="M18 36.7767C30 36.7767 46 45.7767 56 57.7767C58 60.7767 56 63.7767 50 63.7767C36 63.7767 24 52.7767 18 36.7767Z"
        fill={isColor ? "#F4F7F6" : isWhite ? "white" : "currentColor"}
      />
    </svg>
  );
}
