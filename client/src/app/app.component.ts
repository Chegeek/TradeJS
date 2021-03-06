import { Component, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit, OnInit, Output, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { AuthenticationService } from "./services/authenticate.service";
import { SocketService } from "./services/socket.service";
import { CacheService } from "./services/cache.service";
import { OrderService } from "./services/order.service";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subject } from "rxjs/Subject";
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { UserService } from './services/user.service';
import { Http } from '@angular/http';
import { SymbolModel } from './models/symbol.model';

declare let Module: any;

@Component({
	selector: 'app',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit {

	@Output() public filterClick$: EventEmitter<boolean> = new EventEmitter();

	@Output() public searchResults$: Subject<any> = new Subject();
	@ViewChild('input') public input;
	@ViewChild('dropdown') public dropdown;
	@ViewChild('navbar') navbar: ElementRef;

	private _sub: any;
	
	constructor(
		public router: Router,
		public userService: UserService,
		private _http: Http,
		private _cacheService: CacheService,
		private _authenticationService: AuthenticationService) { }

	ngOnInit() {
		this._authenticationService.authenticate();
		
		this.router.events.subscribe((val) => {
			if (val instanceof NavigationStart)
				this.toggleNav(undefined, false);
		});

	}

	public onSearchKeyUp(event): void {
		const value = event.target.value.trim();

		if (!value.length) {
			this.searchResults$.next();
			return;
		}

		const symbols = this._cacheService.getByText(value).slice(0, 5).map((symbol: SymbolModel) => ({
			name: symbol.options.name
		}));

		const currentResult = {
			users: [],
			symbols: symbols,
			channels: []
		};

		this.toggleDropdownVisibility(true);
		this.searchResults$.next(currentResult);

		this._http.get('/search/', { params: { limit: 5, text: value } }).map(res => res.json()).subscribe((result: any) => {
			currentResult.users = result.users;
			this.searchResults$.next(currentResult);
		});
	}

	public onClickDropdownItem() {
		this.toggleDropdownVisibility(false);
	}

	public toggleDropdownVisibility(state) {
		if (this.dropdown) {
			requestAnimationFrame(() => {
				this.dropdown.nativeElement.classList.toggle('hidden', !state)
			})
		}
	}

	public toggleNav(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.navbar.nativeElement.classList.toggle('show', state);
	}

	public onClickFilter(event?, state?: boolean) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.filterClick$.emit(true);
	}

	public onClickOverlay() {
		this.toggleNav(undefined, false);
	}

	public logout(): void {
		this._authenticationService.logout();
	}
}