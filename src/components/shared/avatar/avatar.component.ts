import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

/** Renders the current or another user's avatar: a real image when avatarUrl is set, otherwise a
 *  professional initials fallback -- the one place this logic lives, reused by the shell header
 *  and the profile screen instead of each hand-rolling its own initials computation. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  @Input() avatarUrl: string | null | undefined = null;
  @Input() fullName = '';
  @Input() size = 40;

  get resolvedUrl(): string | null {
    if (!this.avatarUrl) return null;
    if (/^https?:\/\//i.test(this.avatarUrl)) return this.avatarUrl;
    const origin = environment.origin.replace(/\/+$/, '');
    return origin + (this.avatarUrl.startsWith('/') ? this.avatarUrl : '/' + this.avatarUrl);
  }

  get initials(): string {
    const parts = this.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.length === 1
      ? parts[0].charAt(0).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}
